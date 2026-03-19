namespace HxLabwrEd2.DialogWindows;

public interface IDialogService
{
	bool? ShowDialogWithProportionalDimensions(string dialogTitle, object dialogDataContext, double proportionToParentWidth, double proportionToParentHeight);

	bool? ShowDialogWithAbsoluteDimensions(string dialogTitle, object dialogDataContext, int width, int height);
}
