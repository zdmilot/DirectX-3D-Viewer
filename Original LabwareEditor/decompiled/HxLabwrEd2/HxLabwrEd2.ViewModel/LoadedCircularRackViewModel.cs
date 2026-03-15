using System;
using System.ComponentModel;
using System.IO;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Threading;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.ConfigFileWritingAndReading;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class LoadedCircularRackViewModel : LoadedViewModelBase
{
	private bool _expanderOne;

	private bool _expanderTwo;

	private bool _expanderThree;

	private bool _expanderFour;

	private CircularRack _loadedCircularRack;

	private ViewModelBase _labware2DViewDisplayVM;

	private ViewModelBase _generalPropertiesVM;

	private ViewModelBase _barCatPropVM;

	private string _containerButtonText;

	private string _editSegmentsButtonText;

	private string _editSettingsButtonText;

	public string EditSegmentsButtonText
	{
		get
		{
			return _editSegmentsButtonText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => EditSegmentsButtonText), ref _editSegmentsButtonText, value);
		}
	}

	public string ContainerButtonText
	{
		get
		{
			return _containerButtonText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => ContainerButtonText), ref _containerButtonText, value);
		}
	}

	public string EditSettingsButtonText
	{
		get
		{
			return _editSettingsButtonText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => EditSettingsButtonText), ref _editSettingsButtonText, value);
		}
	}

	public bool ExpanderOne
	{
		get
		{
			return _expanderOne;
		}
		set
		{
			if (value || _expanderTwo || _expanderThree || _expanderFour)
			{
				((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ExpanderOne), ref _expanderOne, value);
				if (value)
				{
					ExpanderTwo = false;
					ExpanderThree = false;
					ExpanderFour = false;
				}
			}
		}
	}

	public bool ExpanderTwo
	{
		get
		{
			return _expanderTwo;
		}
		set
		{
			if (value || _expanderOne || _expanderThree || _expanderFour)
			{
				((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ExpanderTwo), ref _expanderTwo, value);
				if (value)
				{
					ExpanderOne = false;
					ExpanderThree = false;
					ExpanderFour = false;
				}
			}
		}
	}

	public bool ExpanderThree
	{
		get
		{
			return _expanderThree;
		}
		set
		{
			if (value || _expanderOne || _expanderTwo || _expanderFour)
			{
				((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ExpanderThree), ref _expanderThree, value);
				if (value)
				{
					ExpanderOne = false;
					ExpanderTwo = false;
					ExpanderFour = false;
				}
			}
		}
	}

	public bool ExpanderFour
	{
		get
		{
			return _expanderFour;
		}
		set
		{
			if (value || _expanderOne || _expanderTwo || _expanderThree)
			{
				((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ExpanderFour), ref _expanderFour, value);
				if (value)
				{
					ExpanderOne = false;
					ExpanderTwo = false;
					ExpanderThree = false;
				}
			}
		}
	}

	public CircularRack LoadedCircularRack
	{
		get
		{
			return _loadedCircularRack;
		}
		set
		{
			if (((ObservableObject)this).Set<CircularRack>((Expression<Func<CircularRack>>)(() => LoadedCircularRack), ref _loadedCircularRack, value))
			{
				base.LoadedLabware = value;
			}
		}
	}

	public ViewModelBase Labware2DViewDisplayVM
	{
		get
		{
			return _labware2DViewDisplayVM;
		}
		set
		{
			((ObservableObject)this).Set<ViewModelBase>((Expression<Func<ViewModelBase>>)(() => Labware2DViewDisplayVM), ref _labware2DViewDisplayVM, value);
		}
	}

	public ViewModelBase GeneralPropertiesVM
	{
		get
		{
			return _generalPropertiesVM;
		}
		set
		{
			((ObservableObject)this).Set<ViewModelBase>((Expression<Func<ViewModelBase>>)(() => GeneralPropertiesVM), ref _generalPropertiesVM, value);
		}
	}

	public ViewModelBase BarCatPropVM
	{
		get
		{
			return _barCatPropVM;
		}
		set
		{
			((ObservableObject)this).Set<ViewModelBase>((Expression<Func<ViewModelBase>>)(() => BarCatPropVM), ref _barCatPropVM, value);
		}
	}

	public RelayCommand FilePath { get; }

	public RelayCommand LaunchCoverDialog { get; }

	public RelayCommand LaunchContainersDialog { get; }

	public RelayCommand LaunchSegmentsDialog { get; }

	public RelayCommand LaunchSettingsDialog { get; }

	public RelayCommand NewContainer { get; }

	public LoadedCircularRackViewModel()
	{
		//IL_00b8: Unknown result type (might be due to invalid IL or missing references)
		//IL_00c2: Expected O, but got Unknown
		//IL_00d0: Unknown result type (might be due to invalid IL or missing references)
		//IL_00da: Expected O, but got Unknown
		//IL_00e8: Unknown result type (might be due to invalid IL or missing references)
		//IL_00f2: Expected O, but got Unknown
		//IL_0100: Unknown result type (might be due to invalid IL or missing references)
		//IL_010a: Expected O, but got Unknown
		//IL_0118: Unknown result type (might be due to invalid IL or missing references)
		//IL_0122: Expected O, but got Unknown
		//IL_0130: Unknown result type (might be due to invalid IL or missing references)
		//IL_013a: Expected O, but got Unknown
		//IL_0148: Unknown result type (might be due to invalid IL or missing references)
		//IL_0152: Expected O, but got Unknown
		//IL_0160: Unknown result type (might be due to invalid IL or missing references)
		//IL_016a: Expected O, but got Unknown
		//IL_0178: Unknown result type (might be due to invalid IL or missing references)
		//IL_0182: Expected O, but got Unknown
		//IL_0190: Unknown result type (might be due to invalid IL or missing references)
		//IL_019a: Expected O, but got Unknown
		//IL_01a8: Unknown result type (might be due to invalid IL or missing references)
		//IL_01b2: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<CircularRack>>((object)this, (object)"LoadThisCircularRack", (Action<GenericMessage<CircularRack>>)delegate(GenericMessage<CircularRack> msg)
		{
			LoadCircularRack(msg.Content, resetExpanders: true);
			ResetExpanders();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"CircularRackBoundaryCorrectionWarning", (Action<NotificationMessage>)delegate
		{
			DisplayBoundaryCorrectionWarning();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RedrawCircularRack", (Action<NotificationMessage>)delegate
		{
			TriggerCircularRackRedraw();
		}, false);
		Messenger.Default.Register<GenericMessage<string>>((object)this, (object)"NewContainerLoadedCircularRack", (Action<GenericMessage<string>>)delegate(GenericMessage<string> msg)
		{
			SetNewContainer(msg.Content);
		}, false);
		Labware2DViewDisplayVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<Labware2DViewModel>();
		GeneralPropertiesVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedGeneralPropertiesViewModel>();
		BarCatPropVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedBarCatPropViewModel>();
		base.SaveAs = new RelayCommand((Action)ExecuteSaveAs, false);
		base.Save = new RelayCommand((Action)ExecuteSave, false);
		base.Validate = new RelayCommand((Action)ExecuteValidate, false);
		base.GenerateVisuals = new RelayCommand((Action)ExecuteGenerateVisuals, false);
		base.NavToTitlePageVM = new RelayCommand((Action)ExecuteNavToTitlePageVM, false);
		LaunchSettingsDialog = new RelayCommand((Action)ExecuteLaunchSettingsDialog, false);
		LaunchCoverDialog = new RelayCommand((Action)ExecuteLaunchCoverDialog, false);
		LaunchSegmentsDialog = new RelayCommand((Action)ExecuteLaunchEditSegmentsDialog, false);
		LaunchContainersDialog = new RelayCommand((Action)ExecuteLaunchContainersDialog, false);
		FilePath = new RelayCommand((Action)ExecuteFilePath, false);
		NewContainer = new RelayCommand((Action)ExecuteNewContainer, false);
	}

	private void SubscribeToAllNeededPropertyChangedEvents()
	{
		((ObservableObject)_loadedCircularRack.SingleRepeatingContainer).PropertyChanged += SingleRepeatingContainerPropertyChanged;
		((ObservableObject)_loadedCircularRack.SingleRepeatingContainer.Offsets).PropertyChanged += SingleContainerOffsetsPropertyChanged;
		((ObservableObject)_loadedCircularRack).PropertyChanged += LoadedCircularRackPropertyChanged;
	}

	private void UnsubscribeToAllNeededPropertyChangedEvents()
	{
		((ObservableObject)_loadedCircularRack.SingleRepeatingContainer).PropertyChanged -= SingleRepeatingContainerPropertyChanged;
		((ObservableObject)_loadedCircularRack.SingleRepeatingContainer.Offsets).PropertyChanged -= SingleContainerOffsetsPropertyChanged;
		((ObservableObject)_loadedCircularRack).PropertyChanged -= LoadedCircularRackPropertyChanged;
	}

	private void ExecuteFilePath()
	{
		DragDropFileLoadHelper.OpenFileDlgReference = new OpenFileDialog
		{
			Filter = "Container|*.ctr",
			InitialDirectory = HxRegHelper.LabwarePath
		};
		bool? flag = DragDropFileLoadHelper.OpenFileDlgReference.ShowDialog();
		string fileName = DragDropFileLoadHelper.OpenFileDlgReference.FileName;
		DragDropFileLoadHelper.OpenFileDlgReference = null;
		if (flag == true)
		{
			_loadedCircularRack.SingleRepeatingContainer.FilePath = fileName;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"CircularRackContainerPathScroll");
		}
	}

	private void TriggerCircularRackRedraw()
	{
		_loadedCircularRack?.TriggerRedraw();
	}

	private void UpdateSingleContainer()
	{
		if (_loadedCircularRack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			RackHelper.UpdateSingleContainerRelativePath(_loadedCircularRack, null);
			_loadedCircularRack.TriggerRedraw();
		}
	}

	private void ExecuteLaunchSettingsDialog()
	{
		bool? flag = DialogWindowHelper.ShowDialogWithAbsoluteDimensions("Boundary and Sequence Label Settings", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogCircularRackSettingsViewModel>(), _loadedCircularRack, 1100, 500);
		if (flag.HasValue && flag == true)
		{
			_loadedCircularRack.RegenerateRackWells();
			_loadedCircularRack.TriggerRedraw();
		}
	}

	private void ExecuteLaunchCoverDialog()
	{
		DialogWindowHelper.ShowDialogWithProportionalDimensions("Cover", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogRectangularRackCoverViewModel>(), _loadedCircularRack, 0.45, 0.9);
	}

	private void ExecuteLaunchContainersDialog()
	{
		bool? flag = DialogWindowHelper.ShowDialogWithProportionalDimensions("Custom Container Layout", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogRackContainersViewModel>(), _loadedCircularRack, 0.9, 0.8);
		if (flag.HasValue && flag == true)
		{
			ConfigFileReader.UpdateRackDrawContainers(_loadedCircularRack);
			_loadedCircularRack.TriggerRedraw();
		}
	}

	private void ExecuteLaunchEditSegmentsDialog()
	{
		bool? flag = DialogWindowHelper.ShowDialogWithProportionalDimensions("Rack Segments", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogCircularRackSegmentsViewModel>(), _loadedCircularRack, 0.8, 0.9);
		if (flag.HasValue && flag == true)
		{
			_loadedCircularRack.RegenerateRackWells();
			_loadedCircularRack.TriggerRedraw();
		}
	}

	private void LoadCircularRack(CircularRack circularRackToLoad, bool resetExpanders)
	{
		if (_loadedCircularRack != null)
		{
			UnsubscribeToAllNeededPropertyChangedEvents();
		}
		LoadedCircularRack = circularRackToLoad;
		if (resetExpanders)
		{
			ExpanderOne = true;
		}
		AppTitleHelper.UpdateTitle((Labware)_loadedCircularRack);
		if (base.ViewLoaded)
		{
			ExecuteGenerateVisuals();
		}
	}

	private void ExecuteGenerateVisuals()
	{
		SubscribeToAllNeededPropertyChangedEvents();
		if (!lockVisuals)
		{
			base.ViewLoaded = true;
			GenericMessage<Labware> val = new GenericMessage<Labware>((Labware)LoadedCircularRack);
			Messenger.Default.Send<GenericMessage<Labware>>(val, (object)"Draw2DLabware");
			Messenger.Default.Send<GenericMessage<Labware>>(val, (object)"LoadGeneralProperties");
			Messenger.Default.Send<GenericMessage<Labware>>(val, (object)"LoadBarCatProp");
			UpdateDialogButtonText();
		}
	}

	private void ExecuteNavToTitlePageVM()
	{
		if (CommandLineArgumentHelper.LimitedFlag)
		{
			Application.Current.Shutdown();
		}
		if (!_loadedCircularRack.DataChanged || _loadedCircularRack.ReadOnly || DialogWindowHelper.ShowDialogWithProportionalDimensions("Confirmation", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogUnsavedChangesViewModel>(), UnsavedChangesDialogExitText.PageExit, 0.4, 0.2) != false)
		{
			if (FilteringEditLabwareHelper.IsEditingLabwareForFiltering)
			{
				FilteringEditLabwareHelper.Finish();
			}
			else
			{
				Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<TitlePageViewModel>()), (object)"Navigation");
			}
		}
	}

	protected override void CleanVisuals()
	{
		//IL_002f: Unknown result type (might be due to invalid IL or missing references)
		//IL_003e: Expected O, but got Unknown
		//IL_0048: Unknown result type (might be due to invalid IL or missing references)
		//IL_0057: Expected O, but got Unknown
		UnsubscribeToAllNeededPropertyChangedEvents();
		if (!lockVisuals)
		{
			LoadedCircularRack = null;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"Clear2DDrawing");
			Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"UnloadGeneralProperties");
			Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"UnloadBarCatProp");
		}
	}

	private void SingleRepeatingContainerPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "FilePath")
		{
			UpdateSingleContainer();
		}
	}

	private void SingleContainerOffsetsPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		_loadedCircularRack?.UpdateRackWellsWithRepeatedContainerOffsets();
		if (e.PropertyName == "X" || e.PropertyName == "Y")
		{
			_loadedCircularRack.TriggerRedraw();
		}
	}

	private void LoadedCircularRackPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "DataChanged")
		{
			Application.Current.Dispatcher.BeginInvoke((Action)delegate
			{
				AppTitleHelper.UpdateTitle((Labware)LoadedCircularRack);
			}, DispatcherPriority.Background, null);
		}
		else if (e.PropertyName == "ReadOnly")
		{
			UpdateDialogButtonText();
		}
		else if (e.PropertyName == "WellDiameter" || e.PropertyName == "ContainerLayout" || e.PropertyName == "BackgroundColor")
		{
			_loadedCircularRack.TriggerRedraw();
		}
		else if (e.PropertyName == "Redraw")
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)_loadedCircularRack), (object)"Draw2DLabware");
		}
	}

	private void ResetExpanders()
	{
		ExpanderOne = true;
		ExpanderTwo = false;
		ExpanderThree = false;
		ExpanderFour = false;
	}

	private void ExecuteSaveAs()
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog
		{
			Filter = "Circular Rack|*.crk",
			InitialDirectory = Environment.CurrentDirectory
		};
		if (saveFileDialog.ShowDialog() != true)
		{
			return;
		}
		_loadedCircularRack.Saving = true;
		string text = saveFileDialog.FileName;
		string directoryName = Path.GetDirectoryName(_loadedCircularRack.LabwareFileFullPath);
		string pattern = "^.*\\.(crk|CRK)$";
		if (!Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase))
		{
			text += ".crk";
		}
		string labwareFileFullPath = _loadedCircularRack.LabwareFileFullPath;
		_loadedCircularRack.LabwareFileFullPath = text;
		string directoryName2 = Path.GetDirectoryName(_loadedCircularRack.LabwareFileFullPath);
		RackContainer singleRepeatingContainer = null;
		TrulyObservableCollection<RackWell> trulyObservableCollection = null;
		if (_loadedCircularRack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			singleRepeatingContainer = new RackContainer(_loadedCircularRack.SingleRepeatingContainer);
			if (directoryName2 != directoryName)
			{
				RackHelper.UpdateAssignedLabwarePaths(_loadedCircularRack, labwareFileFullPath);
			}
			else
			{
				RackHelper.UpdateSingleContainerFilePath(_loadedCircularRack);
			}
		}
		else if (_loadedCircularRack.ContainerLayout == ContainerLayout.MultipleContainers)
		{
			trulyObservableCollection = new TrulyObservableCollection<RackWell>();
			foreach (RackWell rackWell in _loadedCircularRack.RackWells)
			{
				trulyObservableCollection.Add(new RackWell(rackWell));
			}
			if (directoryName2 != directoryName)
			{
				RackHelper.UpdateAssignedLabwarePaths(_loadedCircularRack, labwareFileFullPath);
			}
			else
			{
				RackHelper.UpdateMultipleContainersFilePath(_loadedCircularRack);
			}
		}
		if (ConfigFileWriter.Save(_loadedCircularRack, clearAuditHistory: false))
		{
			ReloadSavedCircularRack(_loadedCircularRack.LabwareFileFullPath, resetExpanders: true);
			return;
		}
		_loadedCircularRack.LabwareFileFullPath = labwareFileFullPath;
		if (_loadedCircularRack.ContainerLayout == ContainerLayout.MultipleContainers)
		{
			_loadedCircularRack.SingleRepeatingContainer = singleRepeatingContainer;
		}
		else
		{
			_loadedCircularRack.RackWells = trulyObservableCollection;
		}
		_loadedCircularRack.Saving = false;
	}

	private void ReloadSavedCircularRack(string fileName, bool resetExpanders)
	{
		CircularRack circularRackToLoad = ConfigFileReader.ReadLabwareFromFile(fileName) as CircularRack;
		LoadCircularRack(circularRackToLoad, resetExpanders);
		AppTitleHelper.UpdateTitle((Labware)_loadedCircularRack);
	}

	private void ExecuteSave()
	{
		RefreshDelayedBindings();
		_loadedCircularRack.Saving = true;
		string filePath = "";
		TrulyObservableCollection<RackWell> trulyObservableCollection = null;
		switch (_loadedCircularRack.ContainerLayout)
		{
		case ContainerLayout.SingleContainer:
			filePath = _loadedCircularRack.SingleRepeatingContainer.FilePath;
			RackHelper.UpdateSingleContainerFilePath(_loadedCircularRack);
			break;
		case ContainerLayout.MultipleContainers:
			trulyObservableCollection = new TrulyObservableCollection<RackWell>();
			foreach (RackWell rackWell in _loadedCircularRack.RackWells)
			{
				trulyObservableCollection.Add(new RackWell(rackWell));
			}
			RackHelper.UpdateMultipleContainersFilePath(_loadedCircularRack);
			break;
		}
		if (ConfigFileWriter.Save(_loadedCircularRack, clearAuditHistory: false))
		{
			ReloadSavedCircularRack(_loadedCircularRack.LabwareFileFullPath, resetExpanders: false);
			return;
		}
		switch (_loadedCircularRack.ContainerLayout)
		{
		case ContainerLayout.SingleContainer:
			_loadedCircularRack.SingleRepeatingContainer.FilePath = filePath;
			break;
		case ContainerLayout.MultipleContainers:
			_loadedCircularRack.RackWells = trulyObservableCollection;
			break;
		}
		_loadedCircularRack.Saving = false;
		_loadedCircularRack.TriggerRedraw();
	}

	private void ExecuteValidate()
	{
		bool flag = RefreshDelayedBindings();
		_loadedCircularRack.Saving = true;
		string filePath = "";
		TrulyObservableCollection<RackWell> trulyObservableCollection = null;
		if (_loadedCircularRack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			filePath = _loadedCircularRack.SingleRepeatingContainer.FilePath;
			RackHelper.UpdateSingleContainerFilePath(_loadedCircularRack);
		}
		else if (_loadedCircularRack.ContainerLayout == ContainerLayout.MultipleContainers)
		{
			trulyObservableCollection = new TrulyObservableCollection<RackWell>();
			foreach (RackWell rackWell in _loadedCircularRack.RackWells)
			{
				trulyObservableCollection.Add(new RackWell(rackWell));
			}
			RackHelper.UpdateMultipleContainersFilePath(_loadedCircularRack);
		}
		if (ConfigFileWriter.Validate(_loadedCircularRack))
		{
			ReloadSavedCircularRack(_loadedCircularRack.LabwareFileFullPath, resetExpanders: false);
			return;
		}
		if (_loadedCircularRack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			_loadedCircularRack.SingleRepeatingContainer.FilePath = filePath;
		}
		else if (_loadedCircularRack.ContainerLayout == ContainerLayout.MultipleContainers)
		{
			_loadedCircularRack.RackWells = trulyObservableCollection;
		}
		_loadedCircularRack.Saving = false;
		if (flag)
		{
			_loadedCircularRack.TriggerRedraw();
		}
	}

	private bool RefreshDelayedBindings()
	{
		//IL_007b: Unknown result type (might be due to invalid IL or missing references)
		//IL_008a: Expected O, but got Unknown
		UnsubscribeToAllNeededPropertyChangedEvents();
		string filePath = _loadedCircularRack.SingleRepeatingContainer.FilePath;
		double x = _loadedCircularRack.Dimensions.X;
		double y = _loadedCircularRack.Dimensions.Y;
		double x2 = _loadedCircularRack.SingleRepeatingContainer.Offsets.X;
		double y2 = _loadedCircularRack.SingleRepeatingContainer.Offsets.Y;
		double wellDiameter = _loadedCircularRack.WellDiameter;
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"LoadedCircularRackRefreshDelayedBindings");
		SubscribeToAllNeededPropertyChangedEvents();
		if (x2 != _loadedCircularRack.SingleRepeatingContainer.Offsets.X || y2 != _loadedCircularRack.SingleRepeatingContainer.Offsets.Y)
		{
			_loadedCircularRack.UpdateRackWellsWithRepeatedContainerOffsets();
			return true;
		}
		if (filePath != _loadedCircularRack.SingleRepeatingContainer.FilePath || x != _loadedCircularRack.Dimensions.X || y != _loadedCircularRack.Dimensions.Y || wellDiameter != _loadedCircularRack.WellDiameter)
		{
			return true;
		}
		return false;
	}

	private void ExecuteNewContainer()
	{
		RefreshDelayedBindings();
		RackNewContainerHelper.Start();
	}

	private void UpdateDialogButtonText()
	{
		if (_loadedCircularRack != null)
		{
			ContainerButtonText = (LoadedCircularRack.ReadOnly ? "View Container Layout" : "Edit Container Layout");
			EditSegmentsButtonText = (LoadedCircularRack.ReadOnly ? "View Segments" : "Edit Segments");
			EditSettingsButtonText = (LoadedCircularRack.ReadOnly ? "View Settings" : "Edit Settings");
		}
	}

	private void SetNewContainer(string fullContainerPath)
	{
		if (base.LoadedLabware != null && base.LoadedLabware is Rack && (base.LoadedLabware as Rack).SingleRepeatingContainer != null)
		{
			(base.LoadedLabware as Rack).SingleRepeatingContainer.FilePath = fullContainerPath;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"CircularRackContainerPathScroll");
		}
	}
}
