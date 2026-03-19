using System;

namespace HxLabwrEd2.DialogWindows;

public interface IDialogResultVMHelper
{
	event EventHandler<RequestCloseDialogEventArgs> RequestCloseDialog;
}
