using System;
using GalaSoft.MvvmLight.Command;
using HxLabwrEd2.DialogWindows;

namespace HxLabwrEd2.ViewModel;

public class DialogUnsavedChangesViewModel : DialogViewModelBase
{
	private UnsavedChangesDialogExitText _dialogTextOption;

	public UnsavedChangesDialogExitText DialogTextOption
	{
		get
		{
			return _dialogTextOption;
		}
		set
		{
			_dialogTextOption = value;
			switch (_dialogTextOption)
			{
			case UnsavedChangesDialogExitText.AppExit:
				DialogText = "Unsaved changes will be lost. Close Labware Editor?";
				break;
			case UnsavedChangesDialogExitText.PageExit:
				DialogText = "Unsaved changes will be lost. Leave the current page?";
				break;
			case UnsavedChangesDialogExitText.Generic:
				DialogText = GenericText;
				break;
			default:
				throw new ArgumentOutOfRangeException();
			}
		}
	}

	public string DialogText { get; private set; }

	public string GenericText { get; set; }

	public RelayCommand NoSelection { get; }

	public RelayCommand YesSelection { get; }

	public DialogUnsavedChangesViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		NoSelection = new RelayCommand((Action)ExecuteNoSelection, false);
		YesSelection = new RelayCommand((Action)ExecuteYesSelection, false);
		DialogTextOption = UnsavedChangesDialogExitText.PageExit;
		GenericText = string.Empty;
	}

	private void ExecuteNoSelection()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: false);
		InvokeRequestCloseDialog(e);
	}

	private void ExecuteYesSelection()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: true);
		InvokeRequestCloseDialog(e);
	}
}
