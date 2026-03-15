using System;
using System.ComponentModel;
using System.Text.RegularExpressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.CommandWpf;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.ConfigFileWritingAndReading;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class CreationContainerViewModel : CreationViewModelBase
{
	private HxLabwrEd2.Model.Container container;

	public CreationContainerViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		//IL_0050: Unknown result type (might be due to invalid IL or missing references)
		//IL_005a: Expected O, but got Unknown
		base.GenerateVisuals = new RelayCommand((Action)ExecuteGenerateVisuals, false);
		base.LeftButtonCommand = new RelayCommand((Action)ExecuteLeftButtonCommand, false);
		base.RightButtonCommand = new RelayCommand((Action)ExecuteRightButtonCommand, (Func<bool>)CanExecuteRightButtonCommand, false);
		Messenger.Default.Register<GenericMessage<HxLabwrEd2.Model.Container>>((object)this, (object)"CreateContainer", (Action<GenericMessage<HxLabwrEd2.Model.Container>>)delegate(GenericMessage<HxLabwrEd2.Model.Container> msg)
		{
			SetViewModelsContainer(msg.Content);
		}, false);
		base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedContainerPropertiesViewModel>();
		SimpleIoc.Default.GetInstance<LoadedContainerGeneralPropertiesViewModel>();
		base.Labware2DViewDisplayVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<Labware2DViewModel>();
	}

	~CreationContainerViewModel()
	{
		try
		{
			Messenger.Default.Unregister((object)this);
		}
		finally
		{
			((object)this).Finalize();
		}
	}

	public void SetViewModelsContainer(HxLabwrEd2.Model.Container container)
	{
		this.container = container;
		base.RightButtonContent = "Continue";
		base.SubVMTitleBarContent = "Add/Edit Segments, LLD, and Side Touchoff";
		canContinue = false;
		base.ShowContinueTip = true;
	}

	private void ExecuteLeftButtonCommand()
	{
		if (base.RightButtonContent == "Continue")
		{
			((ObservableObject)container).PropertyChanged -= Container_PropertyChanged;
			container = null;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnloadThisContainer");
			if (RackNewContainerHelper.IsCreatingContainerForRack)
			{
				RackNewContainerHelper.Exit();
			}
			else
			{
				Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<NewLabwareViewModel>()), (object)"Navigation");
			}
		}
		else
		{
			base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedContainerPropertiesViewModel>();
			base.RightButtonContent = "Continue";
			base.SubVMTitleBarContent = "Add/Edit Segments, LLD, and Side Touchoff";
		}
	}

	private void ExecuteRightButtonCommand()
	{
		if (base.RightButtonContent == "Continue")
		{
			double num = 0.0;
			foreach (ContainerSegment segment in container.Segments)
			{
				num += segment.Height;
			}
			num += 2.0;
			container.Clearance = num;
			container.Name = "";
			container.Description = "";
			container.BaseThickness = 0.0;
			container.DeadVolumeHeight = 0.0;
			container.BottomTouchOffHeight = 0.0;
			base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedContainerGeneralPropertiesViewModel>();
			base.RightButtonContent = "Save";
			base.SubVMTitleBarContent = "Dimensions and General Properties";
			return;
		}
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.Filter = "Container (*.ctr)|*.ctr";
		saveFileDialog.InitialDirectory = Environment.CurrentDirectory;
		saveFileDialog.FileName = ((!string.IsNullOrWhiteSpace(container.Name)) ? container.Name : "");
		if (saveFileDialog.ShowDialog() == true)
		{
			string text = saveFileDialog.FileName;
			string pattern = "^.*\\.(ctr|CTR)$";
			if (!Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase))
			{
				text += ".ctr";
			}
			container.LabwareFileFullPath = text;
			if (!ConfigFileWriter.Save(container, clearAuditHistory: true))
			{
				return;
			}
			if (RackNewContainerHelper.IsCreatingContainerForRack)
			{
				RackNewContainerHelper.Finish(container.LabwareFileFullPath);
			}
			else
			{
				Labware labware = ConfigFileReader.ReadLabwareFromFile(container.LabwareFileFullPath);
				Messenger.Default.Send<GenericMessage<HxLabwrEd2.Model.Container>>(new GenericMessage<HxLabwrEd2.Model.Container>(labware as HxLabwrEd2.Model.Container), (object)"LoadThisContainer");
				Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedContainerViewModel>()), (object)"Navigation");
				labware = null;
			}
			((ObservableObject)container).PropertyChanged -= Container_PropertyChanged;
			container = null;
			subVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedContainerPropertiesViewModel>();
		}
		saveFileDialog = null;
	}

	private bool CanExecuteRightButtonCommand()
	{
		if (rightButtonContent == "Continue")
		{
			return canContinue;
		}
		if (saveAllowed)
		{
			return true;
		}
		return false;
	}

	private void ExecuteGenerateVisuals()
	{
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"Clear2DDrawing");
		Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)container), (object)"Draw2DLabware");
		Messenger.Default.Send<GenericMessage<HxLabwrEd2.Model.Container>>(new GenericMessage<HxLabwrEd2.Model.Container>(container), (object)"DisplayThisContainer");
		((ObservableObject)container).PropertyChanged += Container_PropertyChanged;
	}

	private void Container_PropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (!(e.PropertyName == "Redraw"))
		{
			return;
		}
		Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)container), (object)"Draw2DLabware");
		if (container.Segments != null)
		{
			if (container.Segments.Count > 0)
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
