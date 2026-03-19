using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using HxLabwrEd2.DialogWindows;

namespace HxLabwrEd2.ViewModel;

public class DialogSimpleWarningViewModel : DialogViewModelBase
{
	private string warningText;

	public string WarningText
	{
		get
		{
			return warningText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => WarningText), ref warningText, value);
		}
	}

	public RelayCommand CloseWarning { get; }

	public DialogSimpleWarningViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		CloseWarning = new RelayCommand((Action)CloseWarningExecute, false);
	}

	private void CloseWarningExecute()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: true);
		InvokeRequestCloseDialog(e);
	}
}
