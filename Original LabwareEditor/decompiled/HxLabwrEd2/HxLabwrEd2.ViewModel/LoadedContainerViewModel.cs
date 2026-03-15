using System;
using System.ComponentModel;
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

public class LoadedContainerViewModel : LoadedViewModelBase
{
	private HxLabwrEd2.Model.Container loadedContainer;

	private bool expanderOne;

	private bool expanderTwo;

	private ViewModelBase labware2DViewDisplayVM;

	private ViewModelBase expanderOneVM;

	private ViewModelBase expanderTwoVM;

	private double totalContainerVolume;

	public HxLabwrEd2.Model.Container LoadedContainer
	{
		get
		{
			return loadedContainer;
		}
		set
		{
			if (((ObservableObject)this).Set<HxLabwrEd2.Model.Container>((Expression<Func<HxLabwrEd2.Model.Container>>)(() => LoadedContainer), ref loadedContainer, value))
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
			if (value || (!value && expanderTwo))
			{
				((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ExpanderOne), ref expanderOne, value);
				if (value)
				{
					ExpanderTwo = false;
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
			if (value || (!value && expanderOne))
			{
				((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ExpanderTwo), ref expanderTwo, value);
				if (value)
				{
					ExpanderOne = false;
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

	public double TotalContainerVolume
	{
		get
		{
			return totalContainerVolume;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => TotalContainerVolume), ref totalContainerVolume, value);
		}
	}

	public ViewModelBase ExpanderOneVM
	{
		get
		{
			return expanderOneVM;
		}
		set
		{
			((ObservableObject)this).Set<ViewModelBase>((Expression<Func<ViewModelBase>>)(() => ExpanderOneVM), ref expanderOneVM, value);
		}
	}

	public ViewModelBase ExpanderTwoVM
	{
		get
		{
			return expanderTwoVM;
		}
		set
		{
			((ObservableObject)this).Set<ViewModelBase>((Expression<Func<ViewModelBase>>)(() => ExpanderTwoVM), ref expanderTwoVM, value);
		}
	}

	public LoadedContainerViewModel()
	{
		//IL_005e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0068: Expected O, but got Unknown
		//IL_0076: Unknown result type (might be due to invalid IL or missing references)
		//IL_0080: Expected O, but got Unknown
		//IL_008e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0098: Expected O, but got Unknown
		//IL_00a6: Unknown result type (might be due to invalid IL or missing references)
		//IL_00b0: Expected O, but got Unknown
		//IL_00be: Unknown result type (might be due to invalid IL or missing references)
		//IL_00c8: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<HxLabwrEd2.Model.Container>>((object)this, (object)"LoadThisContainer", (Action<GenericMessage<HxLabwrEd2.Model.Container>>)delegate(GenericMessage<HxLabwrEd2.Model.Container> msg)
		{
			LoadContainer(msg.Content, resetExpanders: true);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"LLDValueCorrectionWarning", (Action<NotificationMessage>)delegate
		{
			DisplayLLDValueCorrectionWarning();
		}, false);
		Labware2DViewDisplayVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<Labware2DViewModel>();
		base.GenerateVisuals = new RelayCommand((Action)ExecuteGenerateVisuals, false);
		base.NavToTitlePageVM = new RelayCommand((Action)ExecuteNavToTitlePageVM, false);
		base.SaveAs = new RelayCommand((Action)ExecuteSaveAs, false);
		base.Save = new RelayCommand((Action)ExecuteSave, false);
		base.Validate = new RelayCommand((Action)ExecuteValidate, false);
		ExpanderOneVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedContainerGeneralPropertiesViewModel>();
		ExpanderTwoVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedContainerPropertiesViewModel>();
	}

	~LoadedContainerViewModel()
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

	private void LoadContainer(HxLabwrEd2.Model.Container containerToLoad, bool resetExpanders)
	{
		if (LoadedContainer != null)
		{
			((ObservableObject)LoadedContainer).PropertyChanged -= LoadedContainerPropertyChanged;
		}
		LoadedContainer = containerToLoad;
		if (resetExpanders)
		{
			ExpanderOne = true;
		}
		AppTitleHelper.UpdateTitle((Labware)LoadedContainer);
		if (base.ViewLoaded)
		{
			ExecuteGenerateVisuals();
		}
	}

	private void ExecuteGenerateVisuals()
	{
		base.ViewLoaded = true;
		Messenger.Default.Send<GenericMessage<HxLabwrEd2.Model.Container>>(new GenericMessage<HxLabwrEd2.Model.Container>(LoadedContainer), (object)"DisplayThisContainer");
		GenericMessage<Labware> val = new GenericMessage<Labware>((Labware)LoadedContainer);
		Messenger.Default.Send<GenericMessage<Labware>>(val, (object)"Draw2DLabware");
		((ObservableObject)loadedContainer).PropertyChanged += LoadedContainerPropertyChanged;
	}

	private void LoadedContainerPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "DataChanged")
		{
			Application.Current.Dispatcher.BeginInvoke((Action)delegate
			{
				AppTitleHelper.UpdateTitle((Labware)loadedContainer);
			}, DispatcherPriority.Background, null);
		}
		else if (e.PropertyName == "Redraw")
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)LoadedContainer), (object)"Draw2DLabware");
		}
	}

	private void ExecuteNavToTitlePageVM()
	{
		if (CommandLineArgumentHelper.LimitedFlag)
		{
			Application.Current.Shutdown();
		}
		if (!loadedContainer.DataChanged || loadedContainer.ReadOnly || DialogWindowHelper.ShowDialogWithProportionalDimensions("Confirmation", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogUnsavedChangesViewModel>(), UnsavedChangesDialogExitText.PageExit, 0.4, 0.2) != false)
		{
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<TitlePageViewModel>()), (object)"Navigation");
		}
	}

	protected override void CleanVisuals()
	{
		((ObservableObject)loadedContainer).PropertyChanged -= LoadedContainerPropertyChanged;
		LoadedContainer = null;
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"Clear2DDrawing");
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnloadThisContainer");
	}

	private void DisplayLLDValueCorrectionWarning()
	{
		Application.Current.Dispatcher.BeginInvoke((Action)delegate
		{
			base.LoadedLabware.DataChanged = true;
			DialogWindowHelper.ShowDialogWithProportionalDimensions("LLD Warning", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), "Read in LLD Sensitivity value was invalid. LLD Sensitivity value was corrected to \"Low\".", 0.4, 0.2);
		}, DispatcherPriority.Background, null);
	}

	private void ExecuteSaveAs()
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.Filter = "Container|*.ctr";
		saveFileDialog.InitialDirectory = Environment.CurrentDirectory;
		if (saveFileDialog.ShowDialog() == true)
		{
			string text = saveFileDialog.FileName;
			string pattern = "^.*\\.(ctr|CTR)$";
			if (!Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase))
			{
				text += ".ctr";
			}
			string labwareFileFullPath = LoadedContainer.LabwareFileFullPath;
			loadedContainer.LabwareFileFullPath = text;
			if (ConfigFileWriter.Save(loadedContainer, clearAuditHistory: false))
			{
				ReloadSavedContainer(loadedContainer.LabwareFileFullPath, resetExpanders: true);
			}
			else
			{
				loadedContainer.LabwareFileFullPath = labwareFileFullPath;
			}
		}
	}

	private void ExecuteSave()
	{
		if (ConfigFileWriter.Save(loadedContainer, clearAuditHistory: false))
		{
			ReloadSavedContainer(loadedContainer.LabwareFileFullPath, resetExpanders: false);
		}
	}

	private void ExecuteValidate()
	{
		if (ConfigFileWriter.Validate(loadedContainer))
		{
			ReloadSavedContainer(loadedContainer.LabwareFileFullPath, resetExpanders: false);
		}
	}

	private void ReloadSavedContainer(string fileName, bool resetExpanders)
	{
		HxLabwrEd2.Model.Container containerToLoad = ConfigFileReader.ReadLabwareFromFile(fileName) as HxLabwrEd2.Model.Container;
		LoadContainer(containerToLoad, resetExpanders);
		ExecuteGenerateVisuals();
		AppTitleHelper.UpdateTitle((Labware)LoadedContainer);
	}
}
