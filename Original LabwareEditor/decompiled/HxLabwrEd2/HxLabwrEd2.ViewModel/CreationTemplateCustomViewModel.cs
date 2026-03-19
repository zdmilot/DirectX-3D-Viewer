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

public class CreationTemplateCustomViewModel : CreationViewModelBase
{
	private Template template;

	private readonly string firstSubVMTitle = "Choose/Edit Template Properties";

	public CreationTemplateCustomViewModel()
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
		Messenger.Default.Register<GenericMessage<Template>>((object)this, (object)"CreateCustomTemplate", (Action<GenericMessage<Template>>)delegate(GenericMessage<Template> msg)
		{
			SetViewModelsTemplate(msg.Content);
		}, false);
		base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedTemplatePropertiesViewModel>();
		SimpleIoc.Default.GetInstance<LoadedGeneralPropertiesViewModel>();
		base.Labware2DViewDisplayVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<Labware2DViewModel>();
	}

	private void SetViewModelsTemplate(Template template)
	{
		this.template = template;
		base.RightButtonContent = "Continue";
		base.SubVMTitleBarContent = firstSubVMTitle;
		canContinue = false;
		base.ShowContinueTip = true;
	}

	private void ExecuteGenerateVisuals()
	{
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"Clear2DDrawing");
		Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)template), (object)"Draw2DLabware");
		Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)template), (object)"DisplayThisTemplate");
		Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)template), (object)"LoadGeneralProperties");
		((ObservableObject)template).PropertyChanged += TemplatePropertyChanged;
		((ObservableObject)template.Dimensions).PropertyChanged += DimensionsPropertyChanged;
	}

	private void ExecuteLeftButtonCommand()
	{
		//IL_0074: Unknown result type (might be due to invalid IL or missing references)
		//IL_0083: Expected O, but got Unknown
		if (base.RightButtonContent == "Continue")
		{
			((ObservableObject)template).PropertyChanged -= TemplatePropertyChanged;
			((ObservableObject)template.Dimensions).PropertyChanged -= DimensionsPropertyChanged;
			template = null;
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<NewLabwareViewModel>()), (object)"Navigation");
			Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"UnloadThisTemplate");
			return;
		}
		base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedTemplatePropertiesViewModel>();
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
		template.BackgroundColor = Color.FromArgb(255, 192, 192, 192);
	}

	private void ExecuteRightButtonCommand()
	{
		//IL_001c: Unknown result type (might be due to invalid IL or missing references)
		//IL_002b: Expected O, but got Unknown
		if (base.RightButtonContent == "Continue")
		{
			Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"LoadedTemplateRefreshDelayedBindings");
			base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedGeneralPropertiesViewModel>();
			base.RightButtonContent = "Save";
			base.SubVMTitleBarContent = "General Properties";
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
			((ObservableObject)template).PropertyChanged -= TemplatePropertyChanged;
			((ObservableObject)template.Dimensions).PropertyChanged -= DimensionsPropertyChanged;
			template = null;
			subVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedTemplatePropertiesViewModel>();
		}
		saveFileDialog = null;
	}

	private bool CanExecuteRightButtonCommand()
	{
		if (rightButtonContent == "Continue")
		{
			return canContinue;
		}
		return saveAllowed;
	}

	private void DimensionsPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "X" || e.PropertyName == "Y")
		{
			template.TriggerRedraw();
		}
	}

	private void TemplatePropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "BackgroundColor")
		{
			template.TriggerRedraw();
		}
		else if (e.PropertyName == "Redraw")
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)template), (object)"Draw2DLabware");
			if (template.Sites != null && template.Sites.Count > 0)
			{
				canContinue = true;
				base.ShowContinueTip = false;
			}
			else
			{
				canContinue = false;
				base.ShowContinueTip = true;
			}
		}
	}
}
