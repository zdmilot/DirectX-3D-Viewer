using System;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;

namespace HxLabwrEd2.DialogWindows;

public class DialogViewModelBase : ViewModelBase, IDialogResultVMHelper
{
	public RelayCommand CancelCloseButton { get; protected set; }

	public RelayCommand SaveButton { get; protected set; }

	public event EventHandler<RequestCloseDialogEventArgs> RequestCloseDialog;

	public void InvokeRequestCloseDialog(RequestCloseDialogEventArgs e)
	{
		this.RequestCloseDialog?.Invoke(this, e);
	}
}
