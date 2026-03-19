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

public class CreationIrregularRackViewModel : CreationViewModelBase
{
	private RectangularRack rectangularRack;

	private readonly string firstSubVMTitle = "Choose/Edit Irregular Rack Properties";

	private readonly string secondSubVMTitle = "Choose/Edit Container Properties";

	public CreationIrregularRackViewModel()
	{
		//IL_0064: Unknown result type (might be due to invalid IL or missing references)
		//IL_006e: Expected O, but got Unknown
		//IL_0088: Unknown result type (might be due to invalid IL or missing references)
		//IL_0092: Expected O, but got Unknown
		//IL_00a0: Unknown result type (might be due to invalid IL or missing references)
		//IL_00aa: Expected O, but got Unknown
		//IL_00b8: Unknown result type (might be due to invalid IL or missing references)
		//IL_00c2: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<RectangularRack>>((object)this, (object)"CreateIrregularRectangularRack", (Action<GenericMessage<RectangularRack>>)delegate(GenericMessage<RectangularRack> msg)
		{
			SetViewModelsRectangularRack(msg.Content);
		}, false);
		Messenger.Default.Register<GenericMessage<string>>((object)this, (object)"NewContainerCreationIrregularRack", (Action<GenericMessage<string>>)delegate(GenericMessage<string> msg)
		{
			SetNewContainer(msg.Content);
		}, false);
		base.LeftButtonCommand = new RelayCommand((Action)ExecuteLeftButtonCommand, false);
		base.RightButtonCommand = new RelayCommand((Action)ExecuteRightButtonCommand, (Func<bool>)CanExecuteRightButtonCommand, false);
		base.GenerateVisuals = new RelayCommand((Action)ExecuteGenerateVisuals, false);
		base.CleanUpVisuals = new RelayCommand((Action)ExecuteCleanUpVisuals, false);
		base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationIrregularRackPropertiesViewModel>();
		SimpleIoc.Default.GetInstance<CreationRackContainerPropertiesViewModel>();
		SimpleIoc.Default.GetInstance<LoadedGeneralPropertiesViewModel>();
		base.Labware2DViewDisplayVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<Labware2DViewModel>();
	}

	public override void SubscribeToAllNeededPropertyChangedEvents()
	{
		((ObservableObject)rectangularRack).PropertyChanged += RectangularRackPropertyChanged;
		((ObservableObject)rectangularRack.SingleRepeatingContainer.Offsets).PropertyChanged += OffsetsPropertyChanged;
		((ObservableObject)rectangularRack.Dimensions).PropertyChanged += DimensionsPropertyChanged;
	}

	public override void UnsubscribeToAllNeededPropertyChangedEvents()
	{
		((ObservableObject)rectangularRack).PropertyChanged -= RectangularRackPropertyChanged;
		((ObservableObject)rectangularRack.SingleRepeatingContainer.Offsets).PropertyChanged -= OffsetsPropertyChanged;
		((ObservableObject)rectangularRack.Dimensions).PropertyChanged -= DimensionsPropertyChanged;
	}

	private void SetViewModelsRectangularRack(RectangularRack rectangularRack)
	{
		this.rectangularRack = rectangularRack;
		base.RightButtonContent = "Continue";
		base.SubVMTitleBarContent = firstSubVMTitle;
		base.ShowContinueTip = true;
	}

	private void ExecuteGenerateVisuals()
	{
		SubscribeToAllNeededPropertyChangedEvents();
		if (!lockVisuals)
		{
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"Clear2DDrawing");
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)rectangularRack), (object)"Draw2DLabware");
			Messenger.Default.Send<GenericMessage<RectangularRack>>(new GenericMessage<RectangularRack>(rectangularRack), (object)"DisplayThisIrregularRectangularRack");
			Messenger.Default.Send<GenericMessage<Rack>>(new GenericMessage<Rack>((Rack)rectangularRack), (object)"DisplayThisRackContainerData");
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)rectangularRack), (object)"LoadGeneralProperties");
		}
	}

	private void ExecuteCleanUpVisuals()
	{
		UnsubscribeToAllNeededPropertyChangedEvents();
		if (!lockVisuals)
		{
			rectangularRack = null;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnloadThisIrregularRectangularRack");
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnloadThisRackContainerData");
		}
	}

	public void SetNewContainer(string fullContainerPath)
	{
		rectangularRack.SingleRepeatingContainer.FilePath = fullContainerPath;
		RackHelper.UpdateSingleContainerRelativePath(rectangularRack, null);
		rectangularRack.TriggerRedraw();
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"RackContainerPathScroll");
	}

	private void ExecuteLeftButtonCommand()
	{
		if (base.SubVM is CreationIrregularRackPropertiesViewModel)
		{
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<NewLabwareViewModel>()), (object)"Navigation");
		}
		else if (base.SubVM is CreationRackContainerPropertiesViewModel)
		{
			(base.SubVM as CreationRackContainerPropertiesViewModel).ParentCreationViewModel = null;
			base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationIrregularRackPropertiesViewModel>();
			base.SubVMTitleBarContent = firstSubVMTitle;
			if (rectangularRack.ContainerLayout != ContainerLayout.WellsOnly)
			{
				((ObservableObject)rectangularRack.SingleRepeatingContainer.Offsets).PropertyChanged -= OffsetsPropertyChanged;
				rectangularRack.ContainerLayout = ContainerLayout.WellsOnly;
				rectangularRack.WellDiameter = 4.5;
				rectangularRack.TriggerRedraw();
				rectangularRack.SingleRepeatingContainer = new RackContainer();
				rectangularRack.ContainersAreConnected = false;
				((ObservableObject)rectangularRack.SingleRepeatingContainer.Offsets).PropertyChanged += OffsetsPropertyChanged;
			}
		}
		else
		{
			base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationRackContainerPropertiesViewModel>();
			(base.SubVM as CreationRackContainerPropertiesViewModel).ParentCreationViewModel = this;
			base.RightButtonContent = "Continue";
			base.SubVMTitleBarContent = secondSubVMTitle;
			rectangularRack.Name = "";
			rectangularRack.Description = "";
			rectangularRack.Bitmap = "";
			rectangularRack.Image = "";
			rectangularRack.Model = "";
			rectangularRack.ModelOffsets.X = 0.0;
			rectangularRack.ModelOffsets.Y = 0.0;
			rectangularRack.ModelOffsets.Z = 0.0;
			rectangularRack.Visible = true;
			rectangularRack.BackgroundColor = Color.FromArgb(0, 255, 255, 255);
		}
	}

	private bool CanExecuteRightButtonCommand()
	{
		if (rightButtonContent == "Save")
		{
			return saveAllowed;
		}
		if (rectangularRack?.RackWells != null && rectangularRack.RackWells.Any())
		{
			base.ShowContinueTip = false;
			return true;
		}
		base.ShowContinueTip = true;
		return false;
	}

	private void ExecuteRightButtonCommand()
	{
		if (base.SubVM is CreationIrregularRackPropertiesViewModel)
		{
			base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationRackContainerPropertiesViewModel>();
			(base.SubVM as CreationRackContainerPropertiesViewModel).ParentCreationViewModel = this;
			base.SubVMTitleBarContent = secondSubVMTitle;
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
			Filter = "Rectangular Rack (*.rck)|*.rck",
			InitialDirectory = Environment.CurrentDirectory,
			FileName = ((!string.IsNullOrWhiteSpace(rectangularRack.Name)) ? rectangularRack.Name : "")
		};
		if (saveFileDialog.ShowDialog() != true)
		{
			return;
		}
		string text = saveFileDialog.FileName;
		string pattern = "^.*\\.(rck|RCK)$";
		if (!Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase))
		{
			text += ".rck";
		}
		rectangularRack.LabwareFileFullPath = text;
		RackContainer singleRepeatingContainer = null;
		TrulyObservableCollection<RackWell> trulyObservableCollection = null;
		if (rectangularRack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			singleRepeatingContainer = new RackContainer(rectangularRack.SingleRepeatingContainer);
			RackHelper.UpdateSingleContainerFilePath(rectangularRack);
			RackHelper.UpdateSingleContainerRelativePath(rectangularRack, null);
		}
		else if (rectangularRack.ContainerLayout == ContainerLayout.MultipleContainers)
		{
			trulyObservableCollection = new TrulyObservableCollection<RackWell>();
			foreach (RackWell rackWell in rectangularRack.RackWells)
			{
				trulyObservableCollection.Add(new RackWell(rackWell));
			}
			RackHelper.UpdateAssignedLabwarePaths(rectangularRack, null);
		}
		if (!ConfigFileWriter.Save(rectangularRack, clearAuditHistory: true))
		{
			if (rectangularRack.ContainerLayout == ContainerLayout.SingleContainer)
			{
				rectangularRack.SingleRepeatingContainer = singleRepeatingContainer;
			}
			else if (rectangularRack.ContainerLayout == ContainerLayout.MultipleContainers)
			{
				rectangularRack.RackWells = trulyObservableCollection;
			}
		}
		else
		{
			Labware labware = ConfigFileReader.ReadLabwareFromFile(rectangularRack.LabwareFileFullPath);
			Messenger.Default.Send<GenericMessage<RectangularRack>>(new GenericMessage<RectangularRack>(labware as RectangularRack), (object)"LoadThisRectangularRack");
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedRectangularRackViewModel>()), (object)"Navigation");
			subVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationIrregularRackPropertiesViewModel>();
		}
	}

	private void DimensionsPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "X" || e.PropertyName == "Y")
		{
			rectangularRack.TriggerRedraw();
		}
	}

	private void OffsetsPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		rectangularRack?.UpdateRackWellsWithRepeatedContainerOffsets();
		if (e.PropertyName == "X" || e.PropertyName == "Y")
		{
			rectangularRack.TriggerRedraw();
		}
	}

	private void RectangularRackPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "WellDiameter" || e.PropertyName == "ContainerLayout" || e.PropertyName == "BackgroundColor")
		{
			rectangularRack.TriggerRedraw();
		}
		else if (e.PropertyName == "Redraw")
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)rectangularRack), (object)"Draw2DLabware");
		}
	}
}
