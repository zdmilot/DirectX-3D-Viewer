using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.DialogWindows;

namespace HxLabwrEd2.ViewModel;

public class DialogFilterNamingViewModel : DialogViewModelBase
{
	private string _enteredName;

	private List<string> _availableFiltersDuplicate;

	private string _selectedFilterDuplicate;

	private string _prompt;

	private DialogFilterNamingMode _dialogFilterNamingMode;

	public string EnteredName
	{
		get
		{
			return _enteredName;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => EnteredName), ref _enteredName, value);
		}
	}

	public List<string> AvailableFiltersDuplicate
	{
		get
		{
			return _availableFiltersDuplicate;
		}
		set
		{
			((ObservableObject)this).Set<List<string>>((Expression<Func<List<string>>>)(() => AvailableFiltersDuplicate), ref _availableFiltersDuplicate, value);
		}
	}

	public string SelectedFilterDuplicate
	{
		get
		{
			return _selectedFilterDuplicate;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => SelectedFilterDuplicate), ref _selectedFilterDuplicate, value);
		}
	}

	public string Prompt
	{
		get
		{
			return _prompt;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Prompt), ref _prompt, value);
		}
	}

	public DialogFilterNamingMode DialogFilterNamingMode
	{
		get
		{
			return _dialogFilterNamingMode;
		}
		set
		{
			((ObservableObject)this).Set<DialogFilterNamingMode>((Expression<Func<DialogFilterNamingMode>>)(() => DialogFilterNamingMode), ref _dialogFilterNamingMode, value);
		}
	}

	public DialogFilterNamingViewModel()
	{
		//IL_0031: Unknown result type (might be due to invalid IL or missing references)
		//IL_003b: Expected O, but got Unknown
		//IL_0049: Unknown result type (might be due to invalid IL or missing references)
		//IL_0053: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<object>>((object)this, (object)"DialogFilterNamingSetup", (Action<GenericMessage<object>>)delegate(GenericMessage<object> msg)
		{
			SetupDialog(msg.Content);
		}, false);
		base.SaveButton = new RelayCommand((Action)ExecuteSaveButton, false);
		base.CancelCloseButton = new RelayCommand((Action)ExecuteCancelCloseButton, false);
	}

	private void SetupDialog(object setupData)
	{
		List<object> list = setupData as List<object>;
		DialogFilterNamingMode = (DialogFilterNamingMode)list[0];
		SelectedFilterDuplicate = list[1].ToString();
		AvailableFiltersDuplicate = new List<string>(list[2] as IEnumerable<string>);
		int num = 1;
		bool flag = false;
		while (!flag)
		{
			string text = $"Labware Filter {num++}";
			if (!AvailableFiltersDuplicate.Contains(text))
			{
				EnteredName = text;
				flag = true;
			}
		}
		if (_dialogFilterNamingMode == DialogFilterNamingMode.New)
		{
			Prompt = "Enter name for the new Labware Filter:";
		}
		else
		{
			Prompt = "Enter name you would like to use to save '" + _selectedFilterDuplicate + "' Labware Filter as:";
		}
	}

	private void ExecuteSaveButton()
	{
		if (_dialogFilterNamingMode == DialogFilterNamingMode.New)
		{
			Messenger.Default.Send<GenericMessage<string>>(new GenericMessage<string>(_enteredName), (object)"DialogFilterNamingSetupNew");
		}
		else
		{
			Messenger.Default.Send<GenericMessage<string>>(new GenericMessage<string>(_enteredName), (object)"DialogFilterNamingSetupSaveAs");
		}
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: true);
		InvokeRequestCloseDialog(e);
		AvailableFiltersDuplicate = null;
		EnteredName = null;
	}

	private void ExecuteCancelCloseButton()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: false);
		InvokeRequestCloseDialog(e);
		AvailableFiltersDuplicate = null;
		EnteredName = null;
	}
}
