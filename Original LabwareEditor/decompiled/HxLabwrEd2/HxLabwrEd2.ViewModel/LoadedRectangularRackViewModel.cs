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

public class LoadedRectangularRackViewModel : LoadedViewModelBase
{
	private RectangularRack _loadedRectangularRack;

	private bool expanderOne;

	private bool expanderTwo;

	private bool expanderThree;

	private bool expanderFour;

	private ViewModelBase labware2DViewDisplayVM;

	private ViewModelBase generalPropertiesVM;

	private ViewModelBase barCatPropVM;

	private ViewModelBase wellsVM;

	private ViewModelBase containersVM;

	private string regularPatternButtonText;

	private string irregularPatternButtonText;

	private string containerButtonText;

	private string coverButtonText;

	private string gripButtonText;

	public RectangularRack LoadedRectangularRack
	{
		get
		{
			return _loadedRectangularRack;
		}
		set
		{
			if (((ObservableObject)this).Set<RectangularRack>((Expression<Func<RectangularRack>>)(() => LoadedRectangularRack), ref _loadedRectangularRack, value))
			{
				base.LoadedLabware = value;
			}
		}
	}

	public bool ExpanderOne
	{
		get
		{
			return expanderOne;
		}
		set
		{
			if (value || (!value && (expanderTwo || expanderThree || expanderFour)))
			{
				((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ExpanderOne), ref expanderOne, value);
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
			return expanderTwo;
		}
		set
		{
			if (value || (!value && (expanderOne || expanderThree || expanderFour)))
			{
				((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ExpanderTwo), ref expanderTwo, value);
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
			return expanderThree;
		}
		set
		{
			if (value || (!value && (expanderOne || expanderTwo || expanderFour)))
			{
				((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ExpanderThree), ref expanderThree, value);
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
			return expanderFour;
		}
		set
		{
			if (value || (!value && (expanderOne || expanderTwo || expanderThree)))
			{
				((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ExpanderFour), ref expanderFour, value);
				if (value)
				{
					ExpanderOne = false;
					ExpanderTwo = false;
					ExpanderThree = false;
				}
			}
		}
	}

	public ViewModelBase Labware2DViewDisplayVM
	{
		get
		{
			return labware2DViewDisplayVM;
		}
		set
		{
			((ObservableObject)this).Set<ViewModelBase>((Expression<Func<ViewModelBase>>)(() => Labware2DViewDisplayVM), ref labware2DViewDisplayVM, value);
		}
	}

	public ViewModelBase GeneralPropertiesVM
	{
		get
		{
			return generalPropertiesVM;
		}
		set
		{
			((ObservableObject)this).Set<ViewModelBase>((Expression<Func<ViewModelBase>>)(() => GeneralPropertiesVM), ref generalPropertiesVM, value);
		}
	}

	public ViewModelBase BarCatPropVM
	{
		get
		{
			return barCatPropVM;
		}
		set
		{
			((ObservableObject)this).Set<ViewModelBase>((Expression<Func<ViewModelBase>>)(() => BarCatPropVM), ref barCatPropVM, value);
		}
	}

	public ViewModelBase WellsVM
	{
		get
		{
			return wellsVM;
		}
		set
		{
			((ObservableObject)this).Set<ViewModelBase>((Expression<Func<ViewModelBase>>)(() => WellsVM), ref wellsVM, value);
		}
	}

	public ViewModelBase ContainersVM
	{
		get
		{
			return containersVM;
		}
		set
		{
			((ObservableObject)this).Set<ViewModelBase>((Expression<Func<ViewModelBase>>)(() => ContainersVM), ref containersVM, value);
		}
	}

	public string RegularPatternButtonText
	{
		get
		{
			return regularPatternButtonText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => RegularPatternButtonText), ref regularPatternButtonText, value);
		}
	}

	public string IrregularPatternButtonText
	{
		get
		{
			return irregularPatternButtonText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => IrregularPatternButtonText), ref irregularPatternButtonText, value);
		}
	}

	public string ContainerButtonText
	{
		get
		{
			return containerButtonText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => ContainerButtonText), ref containerButtonText, value);
		}
	}

	public string CoverButtonText
	{
		get
		{
			return coverButtonText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => CoverButtonText), ref coverButtonText, value);
		}
	}

	public string GripButtonText
	{
		get
		{
			return gripButtonText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => GripButtonText), ref gripButtonText, value);
		}
	}

	public RelayCommand FilePath { get; }

	public RelayCommand LaunchCoverDialog { get; }

	public RelayCommand LaunchGripSegmentsDialog { get; }

	public RelayCommand LaunchContainersDialog { get; }

	public RelayCommand LaunchRegularPatternDialog { get; }

	public RelayCommand LaunchIrregularPatternDialog { get; }

	public RelayCommand NewContainer { get; }

	public LoadedRectangularRackViewModel()
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
		//IL_01c0: Unknown result type (might be due to invalid IL or missing references)
		//IL_01ca: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<RectangularRack>>((object)this, (object)"LoadThisRectangularRack", (Action<GenericMessage<RectangularRack>>)delegate(GenericMessage<RectangularRack> msg)
		{
			LoadRectangularRack(msg.Content, resetExpanders: true);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RectangularRackBoundaryCorrectionWarning", (Action<NotificationMessage>)delegate
		{
			DisplayBoundaryCorrectionWarning();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RedrawRectangularRack", (Action<NotificationMessage>)delegate
		{
			TriggerRectangularRackRedraw();
		}, false);
		Messenger.Default.Register<GenericMessage<string>>((object)this, (object)"NewContainerLoadedRectangularRack", (Action<GenericMessage<string>>)delegate(GenericMessage<string> msg)
		{
			SetNewContainer(msg.Content);
		}, false);
		Labware2DViewDisplayVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<Labware2DViewModel>();
		GeneralPropertiesVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedGeneralPropertiesViewModel>();
		BarCatPropVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedBarCatPropViewModel>();
		base.GenerateVisuals = new RelayCommand((Action)ExecuteGenerateVisuals, false);
		base.NavToTitlePageVM = new RelayCommand((Action)ExecuteNavToTitlePageVM, false);
		base.SaveAs = new RelayCommand((Action)ExecuteSaveAs, false);
		base.Save = new RelayCommand((Action)ExecuteSave, false);
		base.Validate = new RelayCommand((Action)ExecuteValidate, false);
		FilePath = new RelayCommand((Action)ExecuteFilePath, false);
		LaunchCoverDialog = new RelayCommand((Action)ExecuteLaunchCoverDialog, false);
		LaunchGripSegmentsDialog = new RelayCommand((Action)ExecuteLaunchGripSegmentsDialog, false);
		LaunchContainersDialog = new RelayCommand((Action)ExecuteLaunchContainersDialog, false);
		LaunchRegularPatternDialog = new RelayCommand((Action)ExecuteLaunchRegularPatternDialog, false);
		LaunchIrregularPatternDialog = new RelayCommand((Action)ExecuteLaunchIrregularPatternDialog, false);
		NewContainer = new RelayCommand((Action)ExecuteNewContainer, false);
	}

	~LoadedRectangularRackViewModel()
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

	private void SubscribeToAllNeededPropertyChangedEvents()
	{
		((ObservableObject)_loadedRectangularRack.Dimensions).PropertyChanged += DimensionsPropertyChanged;
		((ObservableObject)_loadedRectangularRack.SingleRepeatingContainer).PropertyChanged += SingleRepeatingContainerPropertyChanged;
		((ObservableObject)_loadedRectangularRack.SingleRepeatingContainer.Offsets).PropertyChanged += SingleContainerOffsetsPropertyChanged;
		((ObservableObject)_loadedRectangularRack).PropertyChanged += LoadedRectangularRackPropertyChanged;
	}

	private void UnsubscribeToAllNeededPropertyChangedEvents()
	{
		((ObservableObject)_loadedRectangularRack.Dimensions).PropertyChanged -= DimensionsPropertyChanged;
		((ObservableObject)_loadedRectangularRack.SingleRepeatingContainer).PropertyChanged += SingleRepeatingContainerPropertyChanged;
		((ObservableObject)_loadedRectangularRack.SingleRepeatingContainer.Offsets).PropertyChanged -= SingleContainerOffsetsPropertyChanged;
		((ObservableObject)_loadedRectangularRack).PropertyChanged -= LoadedRectangularRackPropertyChanged;
	}

	private void LoadRectangularRack(RectangularRack rectangularRackToLoad, bool resetExpanders)
	{
		if (_loadedRectangularRack != null)
		{
			UnsubscribeToAllNeededPropertyChangedEvents();
			LoadedRectangularRack = null;
		}
		LoadedRectangularRack = rectangularRackToLoad;
		if (resetExpanders)
		{
			ExpanderOne = true;
		}
		AppTitleHelper.UpdateTitle((Labware)_loadedRectangularRack);
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
			GenericMessage<Labware> val = new GenericMessage<Labware>((Labware)LoadedRectangularRack);
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
		if (!_loadedRectangularRack.DataChanged || _loadedRectangularRack.ReadOnly || DialogWindowHelper.ShowDialogWithProportionalDimensions("Confirmation", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogUnsavedChangesViewModel>(), UnsavedChangesDialogExitText.PageExit, 0.4, 0.2) != false)
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
			LoadedRectangularRack = null;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"Clear2DDrawing");
			Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"UnloadGeneralProperties");
			Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"UnloadBarCatProp");
		}
	}

	private void ExecuteSaveAs()
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.Filter = "Rectangular Rack|*.rck";
		saveFileDialog.InitialDirectory = Environment.CurrentDirectory;
		if (saveFileDialog.ShowDialog() != true)
		{
			return;
		}
		_loadedRectangularRack.Saving = true;
		string text = saveFileDialog.FileName;
		string directoryName = Path.GetDirectoryName(_loadedRectangularRack.LabwareFileFullPath);
		string pattern = "^.*\\.(rck|RCK)$";
		if (!Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase))
		{
			text += ".rck";
		}
		string labwareFileFullPath = _loadedRectangularRack.LabwareFileFullPath;
		_loadedRectangularRack.LabwareFileFullPath = text;
		string directoryName2 = Path.GetDirectoryName(_loadedRectangularRack.LabwareFileFullPath);
		RackContainer singleRepeatingContainer = null;
		TrulyObservableCollection<RackWell> trulyObservableCollection = null;
		if (_loadedRectangularRack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			singleRepeatingContainer = new RackContainer(_loadedRectangularRack.SingleRepeatingContainer);
			if (directoryName2 != directoryName)
			{
				RackHelper.UpdateAssignedLabwarePaths(_loadedRectangularRack, labwareFileFullPath);
			}
			else
			{
				RackHelper.UpdateSingleContainerFilePath(_loadedRectangularRack);
			}
		}
		else if (_loadedRectangularRack.ContainerLayout == ContainerLayout.MultipleContainers)
		{
			trulyObservableCollection = new TrulyObservableCollection<RackWell>();
			foreach (RackWell rackWell in _loadedRectangularRack.RackWells)
			{
				trulyObservableCollection.Add(new RackWell(rackWell));
			}
			if (directoryName2 != directoryName)
			{
				RackHelper.UpdateAssignedLabwarePaths(_loadedRectangularRack, labwareFileFullPath);
			}
			else
			{
				RackHelper.UpdateMultipleContainersFilePath(_loadedRectangularRack);
			}
		}
		if (ConfigFileWriter.Save(_loadedRectangularRack, clearAuditHistory: false))
		{
			ReloadSavedRectangularRack(_loadedRectangularRack.LabwareFileFullPath, resetExpanders: true);
			return;
		}
		_loadedRectangularRack.LabwareFileFullPath = labwareFileFullPath;
		if (_loadedRectangularRack.ContainerLayout == ContainerLayout.MultipleContainers)
		{
			_loadedRectangularRack.SingleRepeatingContainer = singleRepeatingContainer;
		}
		else
		{
			_loadedRectangularRack.RackWells = trulyObservableCollection;
		}
		_loadedRectangularRack.Saving = false;
	}

	private void ExecuteSave()
	{
		RefreshDelayedBindings();
		_loadedRectangularRack.Saving = true;
		string filePath = "";
		TrulyObservableCollection<RackWell> trulyObservableCollection = null;
		if (_loadedRectangularRack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			filePath = _loadedRectangularRack.SingleRepeatingContainer.FilePath;
			RackHelper.UpdateSingleContainerFilePath(_loadedRectangularRack);
		}
		else if (_loadedRectangularRack.ContainerLayout == ContainerLayout.MultipleContainers)
		{
			trulyObservableCollection = new TrulyObservableCollection<RackWell>();
			foreach (RackWell rackWell in _loadedRectangularRack.RackWells)
			{
				trulyObservableCollection.Add(new RackWell(rackWell));
			}
			RackHelper.UpdateMultipleContainersFilePath(_loadedRectangularRack);
		}
		if (ConfigFileWriter.Save(_loadedRectangularRack, clearAuditHistory: false))
		{
			ReloadSavedRectangularRack(_loadedRectangularRack.LabwareFileFullPath, resetExpanders: false);
			return;
		}
		if (_loadedRectangularRack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			_loadedRectangularRack.SingleRepeatingContainer.FilePath = filePath;
		}
		else if (_loadedRectangularRack.ContainerLayout == ContainerLayout.MultipleContainers)
		{
			_loadedRectangularRack.RackWells = trulyObservableCollection;
		}
		_loadedRectangularRack.Saving = false;
		_loadedRectangularRack.TriggerRedraw();
	}

	private void ExecuteValidate()
	{
		bool flag = RefreshDelayedBindings();
		_loadedRectangularRack.Saving = true;
		string filePath = "";
		TrulyObservableCollection<RackWell> trulyObservableCollection = null;
		if (_loadedRectangularRack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			filePath = _loadedRectangularRack.SingleRepeatingContainer.FilePath;
			RackHelper.UpdateSingleContainerFilePath(_loadedRectangularRack);
		}
		else if (_loadedRectangularRack.ContainerLayout == ContainerLayout.MultipleContainers)
		{
			trulyObservableCollection = new TrulyObservableCollection<RackWell>();
			foreach (RackWell rackWell in _loadedRectangularRack.RackWells)
			{
				trulyObservableCollection.Add(new RackWell(rackWell));
			}
			RackHelper.UpdateMultipleContainersFilePath(_loadedRectangularRack);
		}
		if (ConfigFileWriter.Validate(_loadedRectangularRack))
		{
			ReloadSavedRectangularRack(_loadedRectangularRack.LabwareFileFullPath, resetExpanders: false);
			return;
		}
		if (_loadedRectangularRack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			_loadedRectangularRack.SingleRepeatingContainer.FilePath = filePath;
		}
		else if (_loadedRectangularRack.ContainerLayout == ContainerLayout.MultipleContainers)
		{
			_loadedRectangularRack.RackWells = trulyObservableCollection;
		}
		_loadedRectangularRack.Saving = false;
		if (flag)
		{
			_loadedRectangularRack.TriggerRedraw();
		}
	}

	private bool RefreshDelayedBindings()
	{
		//IL_007b: Unknown result type (might be due to invalid IL or missing references)
		//IL_008a: Expected O, but got Unknown
		UnsubscribeToAllNeededPropertyChangedEvents();
		string filePath = _loadedRectangularRack.SingleRepeatingContainer.FilePath;
		double x = _loadedRectangularRack.Dimensions.X;
		double y = _loadedRectangularRack.Dimensions.Y;
		double x2 = _loadedRectangularRack.SingleRepeatingContainer.Offsets.X;
		double y2 = _loadedRectangularRack.SingleRepeatingContainer.Offsets.Y;
		double wellDiameter = _loadedRectangularRack.WellDiameter;
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"LoadedRectangularRackRefreshDelayedBindings");
		SubscribeToAllNeededPropertyChangedEvents();
		if (x2 != _loadedRectangularRack.SingleRepeatingContainer.Offsets.X || y2 != _loadedRectangularRack.SingleRepeatingContainer.Offsets.Y)
		{
			_loadedRectangularRack.UpdateRackWellsWithRepeatedContainerOffsets();
			return true;
		}
		if (filePath != _loadedRectangularRack.SingleRepeatingContainer.FilePath || x != _loadedRectangularRack.Dimensions.X || y != _loadedRectangularRack.Dimensions.Y || wellDiameter != _loadedRectangularRack.WellDiameter)
		{
			return true;
		}
		return false;
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
			_loadedRectangularRack.SingleRepeatingContainer.FilePath = fileName;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"RectangularRackContainerPathScroll");
		}
	}

	private void ReloadSavedRectangularRack(string fileName, bool resetExpanders)
	{
		RectangularRack rectangularRackToLoad = ConfigFileReader.ReadLabwareFromFile(fileName) as RectangularRack;
		LoadRectangularRack(rectangularRackToLoad, resetExpanders);
		AppTitleHelper.UpdateTitle((Labware)_loadedRectangularRack);
	}

	private void DimensionsPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "X" || e.PropertyName == "Y")
		{
			_loadedRectangularRack.TriggerRedraw();
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
		_loadedRectangularRack?.UpdateRackWellsWithRepeatedContainerOffsets();
		if (e.PropertyName == "X" || e.PropertyName == "Y")
		{
			_loadedRectangularRack.TriggerRedraw();
		}
	}

	private void LoadedRectangularRackPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "DataChanged")
		{
			Application.Current.Dispatcher.BeginInvoke((Action)delegate
			{
				AppTitleHelper.UpdateTitle((Labware)_loadedRectangularRack);
			}, DispatcherPriority.Background, null);
		}
		else if (e.PropertyName == "ReadOnly")
		{
			UpdateDialogButtonText();
		}
		else if (e.PropertyName == "WellPattern" || e.PropertyName == "Orientation" || e.PropertyName == "WellDiameter" || e.PropertyName == "ContainerLayout" || e.PropertyName == "BackgroundColor")
		{
			_loadedRectangularRack.TriggerRedraw();
		}
		else if (e.PropertyName == "Redraw")
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)_loadedRectangularRack), (object)"Draw2DLabware");
		}
	}

	private void TriggerRectangularRackRedraw()
	{
		_loadedRectangularRack.TriggerRedraw();
	}

	private void UpdateSingleContainer()
	{
		if (_loadedRectangularRack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			RackHelper.UpdateSingleContainerRelativePath(LoadedRectangularRack, null);
			_loadedRectangularRack.TriggerRedraw();
		}
	}

	private void ExecuteLaunchCoverDialog()
	{
		DialogWindowHelper.ShowDialogWithProportionalDimensions("Cover", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogRectangularRackCoverViewModel>(), _loadedRectangularRack, 0.45, 0.9);
	}

	private void ExecuteLaunchGripSegmentsDialog()
	{
		DialogWindowHelper.ShowDialogWithProportionalDimensions("Grip Segments", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogRackGripSegmentsViewModel>(), _loadedRectangularRack, 0.75, 0.95);
	}

	private void ExecuteLaunchContainersDialog()
	{
		bool? flag = DialogWindowHelper.ShowDialogWithProportionalDimensions("Custom Container Layout", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogRackContainersViewModel>(), _loadedRectangularRack, 0.9, 0.8);
		if (flag.HasValue && flag == true)
		{
			ConfigFileReader.UpdateRackDrawContainers(LoadedRectangularRack);
			_loadedRectangularRack.TriggerRedraw();
		}
	}

	private void ExecuteLaunchRegularPatternDialog()
	{
		bool? flag = DialogWindowHelper.ShowDialogWithProportionalDimensions("Regular Pattern", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogRackRegularPatternViewModel>(), _loadedRectangularRack, 0.97, 0.7);
		if (flag.HasValue && flag == true)
		{
			_loadedRectangularRack.RegenerateRackWells();
			_loadedRectangularRack.TriggerRedraw();
		}
	}

	private void ExecuteLaunchIrregularPatternDialog()
	{
		bool? flag = DialogWindowHelper.ShowDialogWithProportionalDimensions("Irregular Pattern", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogRackIrregularPatternViewModel>(), _loadedRectangularRack, 0.35, 0.9);
		if (flag.HasValue && flag == true)
		{
			_loadedRectangularRack.TriggerRedraw();
		}
	}

	private void ExecuteNewContainer()
	{
		RefreshDelayedBindings();
		RackNewContainerHelper.Start();
	}

	private void UpdateDialogButtonText()
	{
		if (_loadedRectangularRack != null)
		{
			if (_loadedRectangularRack.ReadOnly)
			{
				RegularPatternButtonText = "View Pattern Settings";
				IrregularPatternButtonText = "View Well Settings";
				ContainerButtonText = "View Container Layout";
				CoverButtonText = "View Cover";
				GripButtonText = "View Grip Segments";
			}
			else
			{
				RegularPatternButtonText = "Edit Pattern Settings";
				IrregularPatternButtonText = "Edit Well Settings";
				ContainerButtonText = "Edit Container Layout";
				CoverButtonText = "Edit Cover";
				GripButtonText = "Edit Grip Segments";
			}
		}
	}

	private void SetNewContainer(string containerPath)
	{
		(base.LoadedLabware as Rack).SingleRepeatingContainer.FilePath = containerPath;
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"RectangularRackContainerPathScroll");
	}
}
