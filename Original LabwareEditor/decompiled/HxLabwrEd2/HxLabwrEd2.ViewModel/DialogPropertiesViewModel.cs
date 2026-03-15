using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.DialogWindows;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.ViewModel;

public class DialogPropertiesViewModel : DialogViewModelBase
{
	private Labware labwarePartialDuplicate;

	private Labware loadedLabware;

	private Property selectedProperty;

	private int selectedIndex;

	private bool dataGridHasErrors;

	private object testObject;

	public Labware LabwarePartialDuplicate
	{
		get
		{
			return labwarePartialDuplicate;
		}
		set
		{
			((ObservableObject)this).Set<Labware>((Expression<Func<Labware>>)(() => LabwarePartialDuplicate), ref labwarePartialDuplicate, value);
		}
	}

	public Property SelectedProperty
	{
		get
		{
			return selectedProperty;
		}
		set
		{
			((ObservableObject)this).Set<Property>((Expression<Func<Property>>)(() => SelectedProperty), ref selectedProperty, value);
		}
	}

	public int SelectedIndex
	{
		get
		{
			return selectedIndex;
		}
		set
		{
			((ObservableObject)this).Set<int>((Expression<Func<int>>)(() => SelectedIndex), ref selectedIndex, value);
		}
	}

	public bool DataGridHasErrors
	{
		get
		{
			return dataGridHasErrors;
		}
		set
		{
			if (dataGridHasErrors != value)
			{
				((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => DataGridHasErrors), ref dataGridHasErrors, value);
			}
		}
	}

	public object TestObject
	{
		get
		{
			return testObject;
		}
		set
		{
			((ObservableObject)this).Set<object>((Expression<Func<object>>)(() => TestObject), ref testObject, value);
		}
	}

	public RelayCommand AddProperty { get; }

	public RelayCommand RemoveProperty { get; }

	public DialogPropertiesViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_0038: Unknown result type (might be due to invalid IL or missing references)
		//IL_0042: Expected O, but got Unknown
		//IL_0050: Unknown result type (might be due to invalid IL or missing references)
		//IL_005a: Expected O, but got Unknown
		//IL_0068: Unknown result type (might be due to invalid IL or missing references)
		//IL_0072: Expected O, but got Unknown
		base.CancelCloseButton = new RelayCommand((Action)ExecuteCancelCloseButton, false);
		base.SaveButton = new RelayCommand((Action)ExecuteSaveButton, (Func<bool>)CanExecuteSaveButton, false);
		AddProperty = new RelayCommand((Action)ExecuteAddProperty, false);
		RemoveProperty = new RelayCommand((Action)ExecuteRemoveProperty, false);
		Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"DialogPropertiesSetup", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
		{
			SetupLoadedLabware(msg.Content);
		}, false);
	}

	~DialogPropertiesViewModel()
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

	private void SetupLoadedLabware(Labware loadedLabware)
	{
		this.loadedLabware = loadedLabware;
		if (LabwarePartialDuplicate != null)
		{
			((ObservableObject)LabwarePartialDuplicate).PropertyChanged -= LabwarePartialDuplicate_PropertyChanged;
		}
		LabwarePartialDuplicate = new Labware();
		LabwarePartialDuplicate.ReadOnly = loadedLabware.ReadOnly;
		foreach (Property property in loadedLabware.Properties)
		{
			LabwarePartialDuplicate.Properties.Add(new Property(property.Name, property.Value));
		}
		if (labwarePartialDuplicate.Properties.Count > 0)
		{
			SelectedIndex = 0;
		}
		LabwarePartialDuplicate.DataChanged = false;
		((ObservableObject)LabwarePartialDuplicate).PropertyChanged += LabwarePartialDuplicate_PropertyChanged;
	}

	private void LabwarePartialDuplicate_PropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "DataChanged")
		{
			base.SaveButton.RaiseCanExecuteChanged();
		}
	}

	private void ExecuteCancelCloseButton()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: false);
		InvokeRequestCloseDialog(e);
		loadedLabware = null;
		labwarePartialDuplicate = null;
	}

	private void ExecuteSaveButton()
	{
		IEnumerator<Property> enumerator = labwarePartialDuplicate.Properties.OrderBy((Property property) => property.Name).GetEnumerator();
		TrulyObservableCollection<Property> trulyObservableCollection = new TrulyObservableCollection<Property>();
		while (enumerator.MoveNext())
		{
			trulyObservableCollection.Add(new Property(enumerator.Current.Name, enumerator.Current.Value));
		}
		loadedLabware.Properties = trulyObservableCollection;
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: true);
		InvokeRequestCloseDialog(e);
		loadedLabware = null;
		labwarePartialDuplicate = null;
	}

	private bool CanExecuteSaveButton()
	{
		if (LabwarePartialDuplicate != null && LabwarePartialDuplicate.DataChanged && !dataGridHasErrors)
		{
			return true;
		}
		return false;
	}

	private void ExecuteAddProperty()
	{
		Property property = new Property(Property.FindNextDefaultName(labwarePartialDuplicate.Properties), "");
		LabwarePartialDuplicate.Properties.Add(property);
		Messenger.Default.Send<GenericMessage<object>>(new GenericMessage<object>((object)property), (object)"AddPropertyUI");
	}

	private void ExecuteRemoveProperty()
	{
		//IL_0021: Unknown result type (might be due to invalid IL or missing references)
		//IL_0030: Expected O, but got Unknown
		LabwarePartialDuplicate.Properties.Remove(SelectedProperty);
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"RefreshPropertiesGrid");
	}
}
