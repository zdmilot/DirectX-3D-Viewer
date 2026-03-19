using System;
using System.ComponentModel;
using System.Drawing;
using System.Text.RegularExpressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.CommandWpf;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.ConfigFileWritingAndReading;
using HxLabwrEd2.Model;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class CreationNimbusPedestalViewModel : CreationViewModelBase
{
	private Template template;

	private readonly string firstSubVMTitle = "Choose/Edit Nimbus Pedestal Properties";

	public CreationNimbusPedestalViewModel()
	{
		//IL_001f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0029: Expected O, but got Unknown
		//IL_0037: Unknown result type (might be due to invalid IL or missing references)
		//IL_0041: Expected O, but got Unknown
		//IL_005b: Unknown result type (might be due to invalid IL or missing references)
		//IL_0065: Expected O, but got Unknown
		base.GenerateVisuals = new RelayCommand((Action)ExecuteGenerateVisuals, false);
		base.LeftButtonCommand = new RelayCommand((Action)ExecuteLeftButtonCommand, false);
		base.RightButtonCommand = new RelayCommand((Action)ExecuteRightButtonCommand, (Func<bool>)CanExecuteRightButtonCommand, false);
		Messenger.Default.Register<GenericMessage<Template>>((object)this, (object)"CreateNimbusPedestal", (Action<GenericMessage<Template>>)delegate(GenericMessage<Template> msg)
		{
			SetViewModelsTemplate(msg.Content);
		}, false);
		base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationNimbusPedestalPropertiesViewModel>();
		SimpleIoc.Default.GetInstance<LoadedGeneralPropertiesViewModel>();
		base.Labware2DViewDisplayVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<Labware2DViewModel>();
	}

	private void SetViewModelsTemplate(Template template)
	{
		this.template = template;
		base.RightButtonContent = "Continue";
		base.SubVMTitleBarContent = firstSubVMTitle;
	}

	private void ExecuteGenerateVisuals()
	{
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"Clear2DDrawing");
		Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)template), (object)"Draw2DLabware");
		Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)template), (object)"DisplayThisNimbusPedestal");
		Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)template), (object)"LoadGeneralProperties");
		((ObservableObject)template).PropertyChanged += Template_PropertyChanged;
	}

	private void ExecuteLeftButtonCommand()
	{
		if (rightButtonContent == "Continue")
		{
			((ObservableObject)template).PropertyChanged -= Template_PropertyChanged;
			template = null;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnloadThisNimbusPedestal");
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<NimbusCarrierTypeViewModel>()), (object)"Navigation");
			return;
		}
		base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationNimbusPedestalPropertiesViewModel>();
		base.RightButtonContent = "Continue";
		base.SubVMTitleBarContent = firstSubVMTitle;
		template.Name = "";
		template.Description = "";
		template.Bitmap = "";
		template.Image = "";
		template.Model = "";
		template.ModelOffsets.X = 0.0;
		template.ModelOffsets.Y = 0.0;
		template.ModelOffsets.Z = 0.0;
		template.Visible = true;
		template.BackgroundColor = Color.FromArgb(0, 192, 192, 192);
	}

	private bool CanExecuteRightButtonCommand()
	{
		if (rightButtonContent == "Continue")
		{
			return true;
		}
		return saveAllowed;
	}

	private void ExecuteRightButtonCommand()
	{
		//IL_001c: Unknown result type (might be due to invalid IL or missing references)
		//IL_002b: Expected O, but got Unknown
		if (rightButtonContent == "Continue")
		{
			Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"NimbusPedestalRefreshDelayedBindings");
			base.RightButtonContent = "Save";
			base.SubVMTitleBarContent = "General Properties";
			base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedGeneralPropertiesViewModel>();
			return;
		}
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.Filter = "Template (*.tml)|*.tml";
		saveFileDialog.InitialDirectory = Environment.CurrentDirectory;
		saveFileDialog.FileName = ((!string.IsNullOrWhiteSpace(template.Name)) ? template.Name : "");
		if (saveFileDialog.ShowDialog() == true)
		{
			string text = saveFileDialog.FileName;
			string pattern = "^.*\\.(tml|TML)$";
			if (!Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase))
			{
				text += ".tml";
			}
			template.LabwareFileFullPath = text;
			if (!ConfigFileWriter.Save(template, clearAuditHistory: true))
			{
				return;
			}
			Labware labware = ConfigFileReader.ReadLabwareFromFile(template.LabwareFileFullPath);
			Messenger.Default.Send<GenericMessage<Template>>(new GenericMessage<Template>(labware as Template), (object)"LoadThisTemplate");
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedTemplateViewModel>()), (object)"Navigation");
			labware = null;
			((ObservableObject)template).PropertyChanged -= Template_PropertyChanged;
			template = null;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnloadThisNimbusPedestal");
			subVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationNimbusPedestalPropertiesViewModel>();
		}
		saveFileDialog = null;
	}

	private void Template_PropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "BackgroundColor")
		{
			template.TriggerRedraw();
		}
		else if (e.PropertyName == "Redraw")
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)template), (object)"Draw2DLabware");
		}
	}
}
