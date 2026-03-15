using System;
using System.ComponentModel;
using System.Drawing;
using System.Linq;
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

public class CreationCircularRackViewModel : CreationViewModelBase
{
	private CircularRack circularRack;

	private const string FirstSubVmTitle = "Choose/Edit Circular Rack Properties";

	private const string SecondSubVmTitle = "Choose/Edit Container Properties";

	public CreationCircularRackViewModel()
	{
		//IL_004e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0058: Expected O, but got Unknown
		//IL_0072: Unknown result type (might be due to invalid IL or missing references)
		//IL_007c: Expected O, but got Unknown
		//IL_008a: Unknown result type (might be due to invalid IL or missing references)
		//IL_0094: Expected O, but got Unknown
		//IL_00a2: Unknown result type (might be due to invalid IL or missing references)
		//IL_00ac: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<CircularRack>>((object)this, (object)"CreateCircularRack", (Action<GenericMessage<CircularRack>>)delegate(GenericMessage<CircularRack> msg)
		{
			SetViewModelsCircularRack(msg.Content);
		}, false);
		Messenger.Default.Register<GenericMessage<string>>((object)this, (object)"NewContainerCreationCicularRack", (Action<GenericMessage<string>>)delegate(GenericMessage<string> msg)
		{
			SetNewContainer(msg.Content);
		}, false);
		base.LeftButtonCommand = new RelayCommand((Action)ExecuteLeftButtonCommand, false);
		base.RightButtonCommand = new RelayCommand((Action)ExecuteRightButtonCommand, (Func<bool>)CanExecuteRightButtonCommand, false);
		base.GenerateVisuals = new RelayCommand((Action)ExecuteGenerateVisuals, false);
		base.CleanUpVisuals = new RelayCommand((Action)ExecuteCleanUpVisuals, false);
		base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationCircularRackPropertiesViewModel>();
		SimpleIoc.Default.GetInstance<CreationRackContainerPropertiesViewModel>();
		SimpleIoc.Default.GetInstance<LoadedGeneralPropertiesViewModel>();
		base.Labware2DViewDisplayVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<Labware2DViewModel>();
	}

	public override void SubscribeToAllNeededPropertyChangedEvents()
	{
		((ObservableObject)circularRack).PropertyChanged += CircularRackPropertyChanged;
		((ObservableObject)circularRack.SingleRepeatingContainer.Offsets).PropertyChanged += OffsetsPropertyChanged;
	}

	public override void UnsubscribeToAllNeededPropertyChangedEvents()
	{
		((ObservableObject)circularRack).PropertyChanged -= CircularRackPropertyChanged;
		((ObservableObject)circularRack.SingleRepeatingContainer.Offsets).PropertyChanged -= OffsetsPropertyChanged;
	}

	private void SetViewModelsCircularRack(CircularRack circularRack)
	{
		this.circularRack = circularRack;
		base.ShowContinueTip = true;
		base.RightButtonContent = "Continue";
		base.SubVMTitleBarContent = "Choose/Edit Circular Rack Properties";
	}

	private bool CanExecuteRightButtonCommand()
	{
		if (rightButtonContent == "Save")
		{
			return saveAllowed;
		}
		if (circularRack?.RackWells != null && circularRack.Segments.Any())
		{
			base.ShowContinueTip = false;
			return true;
		}
		base.ShowContinueTip = true;
		return false;
	}

	private void ExecuteGenerateVisuals()
	{
		SubscribeToAllNeededPropertyChangedEvents();
		if (!lockVisuals)
		{
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"Clear2DDrawing");
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)circularRack), (object)"Draw2DLabware");
			Messenger.Default.Send<GenericMessage<CircularRack>>(new GenericMessage<CircularRack>(circularRack), (object)"DisplayThisCircularRack");
			Messenger.Default.Send<GenericMessage<Rack>>(new GenericMessage<Rack>((Rack)circularRack), (object)"DisplayThisRackContainerData");
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)circularRack), (object)"LoadGeneralProperties");
		}
	}

	private void ExecuteCleanUpVisuals()
	{
		UnsubscribeToAllNeededPropertyChangedEvents();
		if (!lockVisuals)
		{
			circularRack = null;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnloadThisCircularRack");
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnloadThisRackContainerData");
		}
	}

	public void SetNewContainer(string fullContainerPath)
	{
		circularRack.SingleRepeatingContainer.FilePath = fullContainerPath;
		RackHelper.UpdateSingleContainerRelativePath(circularRack, null);
		circularRack.TriggerRedraw();
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"RackContainerPathScroll");
	}

	private void ExecuteLeftButtonCommand()
	{
		if (base.SubVM is CreationCircularRackPropertiesViewModel)
		{
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<NewLabwareViewModel>()), (object)"Navigation");
		}
		else if (base.SubVM is CreationRackContainerPropertiesViewModel)
		{
			(base.SubVM as CreationRackContainerPropertiesViewModel).ParentCreationViewModel = null;
			base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationCircularRackPropertiesViewModel>();
			base.SubVMTitleBarContent = "Choose/Edit Circular Rack Properties";
			if (circularRack.ContainerLayout != ContainerLayout.WellsOnly)
			{
				((ObservableObject)circularRack.SingleRepeatingContainer.Offsets).PropertyChanged -= OffsetsPropertyChanged;
				circularRack.ContainerLayout = ContainerLayout.WellsOnly;
				circularRack.WellDiameter = 4.5;
				circularRack.TriggerRedraw();
				circularRack.SingleRepeatingContainer = new RackContainer();
				circularRack.ContainersAreConnected = false;
				((ObservableObject)circularRack.SingleRepeatingContainer.Offsets).PropertyChanged += OffsetsPropertyChanged;
			}
		}
		else
		{
			base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationRackContainerPropertiesViewModel>();
			(base.SubVM as CreationRackContainerPropertiesViewModel).ParentCreationViewModel = this;
			base.RightButtonContent = "Continue";
			base.SubVMTitleBarContent = "Choose/Edit Container Properties";
			circularRack.Name = "";
			circularRack.Description = "";
			circularRack.Bitmap = "";
			circularRack.Image = "";
			circularRack.Model = "";
			circularRack.ModelOffsets.X = 0.0;
			circularRack.ModelOffsets.Y = 0.0;
			circularRack.ModelOffsets.Z = 0.0;
			circularRack.Visible = true;
			circularRack.BackgroundColor = Color.FromArgb(255, 255, 255, 255);
		}
	}

	private void ExecuteRightButtonCommand()
	{
		if (base.SubVM is CreationCircularRackPropertiesViewModel)
		{
			base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationRackContainerPropertiesViewModel>();
			(base.SubVM as CreationRackContainerPropertiesViewModel).ParentCreationViewModel = this;
			base.SubVMTitleBarContent = "Choose/Edit Container Properties";
			return;
		}
		if (base.SubVM is CreationRackContainerPropertiesViewModel)
		{
			(base.SubVM as CreationRackContainerPropertiesViewModel).ParentCreationViewModel = null;
			base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedGeneralPropertiesViewModel>();
			base.SubVMTitleBarContent = "General Properties";
			base.RightButtonContent = "Save";
			return;
		}
		SaveFileDialog saveFileDialog = new SaveFileDialog
		{
			Filter = "Circular Rack (*.crk)|*.crk",
			InitialDirectory = Environment.CurrentDirectory,
			FileName = ((!string.IsNullOrWhiteSpace(circularRack.Name)) ? circularRack.Name : "")
		};
		if (saveFileDialog.ShowDialog() != true)
		{
			return;
		}
		string text = saveFileDialog.FileName;
		if (!Regex.IsMatch(text, "^.*\\.(crk|CRK)$", RegexOptions.IgnoreCase))
		{
			text += ".crk";
		}
		circularRack.LabwareFileFullPath = text;
		RackContainer singleRepeatingContainer = null;
		TrulyObservableCollection<RackWell> trulyObservableCollection = null;
		switch (circularRack.ContainerLayout)
		{
		case ContainerLayout.SingleContainer:
			singleRepeatingContainer = new RackContainer(circularRack.SingleRepeatingContainer);
			RackHelper.UpdateSingleContainerFilePath(circularRack);
			RackHelper.UpdateSingleContainerRelativePath(circularRack, null);
			break;
		case ContainerLayout.MultipleContainers:
			trulyObservableCollection = new TrulyObservableCollection<RackWell>();
			foreach (RackWell rackWell in circularRack.RackWells)
			{
				trulyObservableCollection.Add(new RackWell(rackWell));
			}
			RackHelper.UpdateAssignedLabwarePaths(circularRack, null);
			break;
		}
		if (!ConfigFileWriter.Save(circularRack, clearAuditHistory: true))
		{
			switch (circularRack.ContainerLayout)
			{
			case ContainerLayout.SingleContainer:
				circularRack.SingleRepeatingContainer = singleRepeatingContainer;
				break;
			case ContainerLayout.MultipleContainers:
				circularRack.RackWells = trulyObservableCollection;
				break;
			}
		}
		else
		{
			Labware labware = ConfigFileReader.ReadLabwareFromFile(circularRack.LabwareFileFullPath);
			Messenger.Default.Send<GenericMessage<CircularRack>>(new GenericMessage<CircularRack>(labware as CircularRack), (object)"LoadThisCircularRack");
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedCircularRackViewModel>()), (object)"Navigation");
			subVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationCircularRackPropertiesViewModel>();
		}
	}

	private void OffsetsPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		circularRack?.UpdateRackWellsWithRepeatedContainerOffsets();
		if (e.PropertyName == "X" || e.PropertyName == "Y")
		{
			circularRack.TriggerRedraw();
		}
	}

	private void CircularRackPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		switch (e.PropertyName)
		{
		case "WellDiameter":
		case "ContainerLayout":
		case "BackgroundColor":
			circularRack.TriggerRedraw();
			break;
		case "Redraw":
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)circularRack), (object)"Draw2DLabware");
			break;
		}
	}
}
