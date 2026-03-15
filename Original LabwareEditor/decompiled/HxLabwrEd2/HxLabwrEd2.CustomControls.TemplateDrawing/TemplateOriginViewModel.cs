namespace HxLabwrEd2.CustomControls.TemplateDrawing;

internal class TemplateOriginViewModel : ShapeUI
{
	public TemplateOriginViewModel(double strokeThickness)
	{
		base.StrokeThickness = strokeThickness;
		base.Fill = ShapeUI.RedBrush;
		highlightFill = ShapeUI.HighlightBrush;
	}
}
