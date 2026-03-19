using System.Windows;
using System.Windows.Controls;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.CustomControls.ContainerSegments;

public class SegmentUITemplateSelector : DataTemplateSelector
{
	public override DataTemplate SelectTemplate(object item, DependencyObject container)
	{
		if (container is FrameworkElement frameworkElement && item != null && item is ContainerSegment)
		{
			ContainerSegment containerSegment = item as ContainerSegment;
			if (containerSegment.Shape == Shape.Cylinder)
			{
				return frameworkElement.FindResource("CylinderSegmentUIView") as DataTemplate;
			}
			if (containerSegment.Shape == Shape.InvertedVCone || containerSegment.Shape == Shape.VCone)
			{
				return frameworkElement.FindResource("HalfConeSegmentUIView") as DataTemplate;
			}
			if (containerSegment.Shape == Shape.Rectangle)
			{
				return frameworkElement.FindResource("RectangleSegmentUIView") as DataTemplate;
			}
			if (containerSegment.Shape == Shape.RoundBase)
			{
				return frameworkElement.FindResource("RoundBaseSegmentUIView") as DataTemplate;
			}
			return frameworkElement.FindResource("ConeBaseSegmentUIView") as DataTemplate;
		}
		return null;
	}
}
