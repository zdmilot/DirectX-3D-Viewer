using System;
using GalaSoft.MvvmLight.Command;
using HxLabwrEd2.DialogWindows;

namespace HxLabwrEd2.ViewModel;

public class DialogCategoryDeletionSaveViewModel : DialogViewModelBase
{
	public string DialogText { get; }

	public RelayCommand NoSelection { get; }

	public RelayCommand YesSelection { get; }

	public DialogCategoryDeletionSaveViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		NoSelection = new RelayCommand((Action)ExecuteNoSelection, false);
		YesSelection = new RelayCommand((Action)ExecuteYesSelection, false);
		DialogText = "Categories were Deleted and will not be recoverable after Saving.\nAre you sure you want to Save Categories?";
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
