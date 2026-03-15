using System;
using System.ComponentModel;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class LoadedBarCatPropViewModel : ViewModelBase
{
	private Labware loadedLabware;

	private string categoryButtonText;

	private string propertyButtonText;

	public Labware LoadedLabware
	{
		get
		{
			return loadedLabware;
		}
		set
		{
			if (loadedLabware != null)
			{
				((ObservableObject)loadedLabware).PropertyChanged -= LoadedLabware_PropertyChanged;
			}
			((ObservableObject)this).Set<Labware>((Expression<Func<Labware>>)(() => LoadedLabware), ref loadedLabware, value);
			if (loadedLabware != null)
			{
				((ObservableObject)loadedLabware).PropertyChanged += LoadedLabware_PropertyChanged;
			}
		}
	}

	public string CategoryButtonText
	{
		get
		{
			return categoryButtonText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => CategoryButtonText), ref categoryButtonText, value);
		}
	}

	public string PropertyButtonText
	{
		get
		{
			return propertyButtonText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => PropertyButtonText), ref propertyButtonText, value);
		}
	}

	public RelayCommand LaunchCategoriesDialog { get; }

	public RelayCommand LaunchPropertiesDialog { get; }

	public LoadedBarCatPropViewModel()
	{
		//IL_004e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0058: Expected O, but got Unknown
		//IL_0066: Unknown result type (might be due to invalid IL or missing references)
		//IL_0070: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"LoadBarCatProp", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
		{
			SetLabwareReference(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"UnloadBarCatProp", (Action<NotificationMessage>)delegate
		{
			ResetReferences();
		}, false);
		LaunchCategoriesDialog = new RelayCommand((Action)ExecuteLaunchCategoriesDialog, false);
		LaunchPropertiesDialog = new RelayCommand((Action)ExecuteLaunchPropertiesDialog, false);
	}

	~LoadedBarCatPropViewModel()
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

	private void SetLabwareReference(Labware labware)
	{
		LoadedLabware = labware;
		UpdateDialogButtonText();
	}

	private void ResetReferences()
	{
		LoadedLabware = null;
	}

	private void ExecuteLaunchCategoriesDialog()
	{
		bool? flag = DialogWindowHelper.ShowDialogWithProportionalDimensions("Labware Categories", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogCategoriesViewModel>(), loadedLabware, 0.5, 0.75);
		if (flag.HasValue && flag == true)
		{
			loadedLabware.CategoriesChanged = true;
		}
	}

	private void ExecuteLaunchPropertiesDialog()
	{
		DialogWindowHelper.ShowDialogWithProportionalDimensions("Labware Properties", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogPropertiesViewModel>(), loadedLabware, 0.4, 0.6);
	}

	private void UpdateDialogButtonText()
	{
		if (loadedLabware != null)
		{
			CategoryButtonText = (LoadedLabware.ReadOnly ? "View Categories" : "Edit Categories");
			PropertyButtonText = (LoadedLabware.ReadOnly ? "View Properties" : "Edit Properties");
		}
	}

	private void LoadedLabware_PropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "ReadOnly")
		{
			UpdateDialogButtonText();
		}
	}
}
