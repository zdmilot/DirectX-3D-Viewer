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

public class LoadedTemplateViewModel : LoadedViewModelBase
{
	private Template loadedTemplate;

	private bool expanderOne;

	private bool expanderTwo;

	private bool expanderThree;

	private ViewModelBase labware2DViewDisplayVM;

	private ViewModelBase generalPropertiesVM;

	private ViewModelBase barCatPropVM;

	private ViewModelBase templatePropertiesVM;

	public Template LoadedTemplate
	{
		get
		{
			return loadedTemplate;
		}
		set
		{
			if (((ObservableObject)this).Set<Template>((Expression<Func<Template>>)(() => LoadedTemplate), ref loadedTemplate, value))
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
			if (value || (!value && (expanderTwo || expanderThree)))
			{
				((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ExpanderOne), ref expanderOne, value);
				if (value)
				{
					ExpanderTwo = false;
					ExpanderThree = false;
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
			if (value || (!value && (expanderOne || expanderThree)))
			{
				((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ExpanderTwo), ref expanderTwo, value);
				if (value)
				{
					ExpanderOne = false;
					ExpanderThree = false;
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
			if (value || (!value && (expanderOne || expanderTwo)))
			{
				((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ExpanderThree), ref expanderThree, value);
				if (value)
				{
					ExpanderOne = false;
					ExpanderTwo = false;
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

	public ViewModelBase TemplatePropertiesVM
	{
		get
		{
			return templatePropertiesVM;
		}
		set
		{
			((ObservableObject)this).Set<ViewModelBase>((Expression<Func<ViewModelBase>>)(() => TemplatePropertiesVM), ref templatePropertiesVM, value);
		}
	}

	public LoadedTemplateViewModel()
	{
		//IL_0071: Unknown result type (might be due to invalid IL or missing references)
		//IL_007b: Expected O, but got Unknown
		//IL_0089: Unknown result type (might be due to invalid IL or missing references)
		//IL_0093: Expected O, but got Unknown
		//IL_00a1: Unknown result type (might be due to invalid IL or missing references)
		//IL_00ab: Expected O, but got Unknown
		//IL_00b9: Unknown result type (might be due to invalid IL or missing references)
		//IL_00c3: Expected O, but got Unknown
		//IL_00d1: Unknown result type (might be due to invalid IL or missing references)
		//IL_00db: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<Template>>((object)this, (object)"LoadThisTemplate", (Action<GenericMessage<Template>>)delegate(GenericMessage<Template> msg)
		{
			LoadTemplate(msg.Content, resetExpanders: true);
		}, false);
		Labware2DViewDisplayVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<Labware2DViewModel>();
		GeneralPropertiesVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedGeneralPropertiesViewModel>();
		BarCatPropVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedBarCatPropViewModel>();
		TemplatePropertiesVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedTemplatePropertiesViewModel>();
		base.GenerateVisuals = new RelayCommand((Action)ExecuteGenerateVisuals, false);
		base.NavToTitlePageVM = new RelayCommand((Action)ExecuteNavToTitlePageVM, false);
		base.SaveAs = new RelayCommand((Action)ExecuteSaveAs, false);
		base.Save = new RelayCommand((Action)ExecuteSave, false);
		base.Validate = new RelayCommand((Action)ExecuteValidate, false);
	}

	~LoadedTemplateViewModel()
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
		((ObservableObject)loadedTemplate).PropertyChanged += LoadedTemplatePropertyChanged;
		((ObservableObject)loadedTemplate.Dimensions).PropertyChanged += DimensionsPropertyChanged;
	}

	private void UnsubscribeToAllNeededPropertyChangedEvents()
	{
		((ObservableObject)loadedTemplate).PropertyChanged -= LoadedTemplatePropertyChanged;
		((ObservableObject)loadedTemplate.Dimensions).PropertyChanged -= DimensionsPropertyChanged;
	}

	private void LoadTemplate(Template templateToLoad, bool resetExpanders)
	{
		if (LoadedTemplate != null)
		{
			UnsubscribeToAllNeededPropertyChangedEvents();
		}
		LoadedTemplate = templateToLoad;
		if (resetExpanders)
		{
			ExpanderOne = true;
		}
		AppTitleHelper.UpdateTitle((Labware)LoadedTemplate);
		if (base.ViewLoaded)
		{
			ExecuteGenerateVisuals();
		}
	}

	private void ExecuteGenerateVisuals()
	{
		base.ViewLoaded = true;
		GenericMessage<Labware> val = new GenericMessage<Labware>((Labware)LoadedTemplate);
		Messenger.Default.Send<GenericMessage<Labware>>(val, (object)"Draw2DLabware");
		Messenger.Default.Send<GenericMessage<Labware>>(val, (object)"LoadGeneralProperties");
		Messenger.Default.Send<GenericMessage<Labware>>(val, (object)"LoadBarCatProp");
		Messenger.Default.Send<GenericMessage<Labware>>(val, (object)"DisplayThisTemplate");
		SubscribeToAllNeededPropertyChangedEvents();
	}

	protected override void CleanVisuals()
	{
		//IL_0027: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		//IL_0040: Unknown result type (might be due to invalid IL or missing references)
		//IL_004f: Expected O, but got Unknown
		//IL_0059: Unknown result type (might be due to invalid IL or missing references)
		//IL_0068: Expected O, but got Unknown
		UnsubscribeToAllNeededPropertyChangedEvents();
		LoadedTemplate = null;
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"Clear2DDrawing");
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"UnloadGeneralProperties");
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"UnloadBarCatProp");
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"UnloadThisTemplate");
	}

	private void DimensionsPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "X" || e.PropertyName == "Y")
		{
			loadedTemplate.TriggerRedraw();
		}
	}

	private void LoadedTemplatePropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "DataChanged")
		{
			Application.Current.Dispatcher.BeginInvoke((Action)delegate
			{
				AppTitleHelper.UpdateTitle((Labware)loadedTemplate);
			}, DispatcherPriority.Background, null);
		}
		else if (e.PropertyName == "BackgroundColor")
		{
			loadedTemplate.TriggerRedraw();
		}
		else if (e.PropertyName == "Redraw")
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)LoadedTemplate), (object)"Draw2DLabware");
		}
	}

	private void ExecuteNavToTitlePageVM()
	{
		if (CommandLineArgumentHelper.LimitedFlag)
		{
			Application.Current.Shutdown();
		}
		if (!loadedTemplate.DataChanged || loadedTemplate.ReadOnly || DialogWindowHelper.ShowDialogWithProportionalDimensions("Confirmation", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogUnsavedChangesViewModel>(), UnsavedChangesDialogExitText.PageExit, 0.4, 0.2) != false)
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

	private void ExecuteSaveAs()
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.Filter = "Template|*.tml";
		saveFileDialog.InitialDirectory = Environment.CurrentDirectory;
		if (saveFileDialog.ShowDialog() != true)
		{
			return;
		}
		string text = saveFileDialog.FileName;
		string pattern = "^.*\\.(tml|TML)$";
		if (!Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase))
		{
			text += ".tml";
		}
		string labwareFileFullPath = loadedTemplate.LabwareFileFullPath;
		TrulyObservableCollection<Site> trulyObservableCollection = new TrulyObservableCollection<Site>();
		foreach (Site site in loadedTemplate.Sites)
		{
			trulyObservableCollection.Add(new Site(site));
		}
		loadedTemplate.LabwareFileFullPath = text;
		if (labwareFileFullPath != text)
		{
			TemplateHelper.UpdateAssignedLabwarePaths(loadedTemplate, labwareFileFullPath);
		}
		if (ConfigFileWriter.Save(loadedTemplate, clearAuditHistory: false))
		{
			ReloadSavedTemplate(loadedTemplate.LabwareFileFullPath, resetExpanders: true);
			return;
		}
		loadedTemplate.Sites = trulyObservableCollection;
		loadedTemplate.LabwareFileFullPath = labwareFileFullPath;
		ConfigFileReader.UpdateTemplateAssignedRackStatus(loadedTemplate);
	}

	private void ExecuteSave()
	{
		RefreshDelayedBindings();
		if (ConfigFileWriter.Save(loadedTemplate, clearAuditHistory: false))
		{
			ReloadSavedTemplate(loadedTemplate.LabwareFileFullPath, resetExpanders: false);
		}
		else
		{
			loadedTemplate.TriggerRedraw();
		}
	}

	private void ExecuteValidate()
	{
		RefreshDelayedBindings();
		if (ConfigFileWriter.Validate(loadedTemplate))
		{
			ReloadSavedTemplate(loadedTemplate.LabwareFileFullPath, resetExpanders: false);
		}
		else
		{
			loadedTemplate.TriggerRedraw();
		}
	}

	private void RefreshDelayedBindings()
	{
		//IL_0010: Unknown result type (might be due to invalid IL or missing references)
		//IL_001f: Expected O, but got Unknown
		UnsubscribeToAllNeededPropertyChangedEvents();
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"LoadedTemplateRefreshDelayedBindings");
		SubscribeToAllNeededPropertyChangedEvents();
	}

	private void ReloadSavedTemplate(string fileName, bool resetExpanders)
	{
		Template templateToLoad = ConfigFileReader.ReadLabwareFromFile(fileName) as Template;
		LoadTemplate(templateToLoad, resetExpanders);
		AppTitleHelper.UpdateTitle((Labware)LoadedTemplate);
	}
}
