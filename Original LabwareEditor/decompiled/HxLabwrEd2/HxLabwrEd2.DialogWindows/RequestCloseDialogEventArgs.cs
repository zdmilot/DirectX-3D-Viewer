using System;

namespace HxLabwrEd2.DialogWindows;

public class RequestCloseDialogEventArgs : EventArgs
{
	public bool DialogResult { get; set; }

	public RequestCloseDialogEventArgs(bool dialogresult)
	{
		DialogResult = dialogresult;
	}
}
