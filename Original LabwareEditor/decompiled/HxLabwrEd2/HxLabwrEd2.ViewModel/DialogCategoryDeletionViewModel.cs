using System;
using GalaSoft.MvvmLight.Command;
using HxLabwrEd2.DialogWindows;

namespace HxLabwrEd2.ViewModel;

public class DialogCategoryDeletionViewModel : DialogViewModelBase
{
	public string DialogText
	{
		get
		{
			if (string.IsNullOrEmpty(CategoryName))
			{
				return "Are you sure you want to Delete selected Category? Deleted Categories cannot be recovered after Saving!";
			}
			return "Are you sure you want to Delete \"" + CategoryName + "\" Category? Deleted Categories cannot be recovered after Saving!";
		}
	}

	public string CategoryName { get; set; }

	public RelayCommand NoSelection { get; }

	public RelayCommand YesSelection { get; }

	public DialogCategoryDeletionViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		NoSelection = new RelayCommand((Action)ExecuteNoSelection, false);
		YesSelection = new RelayCommand((Action)ExecuteYesSelection, false);
	}

	private void ExecuteNoSelection()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: false);
		InvokeRequestCloseDialog(e);
		CategoryName = string.Empty;
	}

	private void ExecuteYesSelection()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: true);
		InvokeRequestCloseDialog(e);
		CategoryName = string.Empty;
	}
}
