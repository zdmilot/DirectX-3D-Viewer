using System.Drawing;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.StaticHelpers;

public static class NewLabwareWithDefaultsHelper
{
	public static RectangularRack MicrotiterPlate()
	{
		RectangularRack rectangularRack = new RectangularRack();
		InitializeRackDataTo96Plate(rectangularRack);
		return rectangularRack;
	}

	public static RectangularRack RegularRectangularRack()
	{
		RectangularRack rectangularRack = new RectangularRack();
		InitializeRackDataTo96Plate(rectangularRack);
		rectangularRack.WellPattern = WellPattern.Regular;
		rectangularRack.ContainerLayout = ContainerLayout.WellsOnly;
		return rectangularRack;
	}

	public static RectangularRack IrregularRectangularRack()
	{
		RectangularRack rectangularRack = new RectangularRack();
		InitializeRackDataTo96Plate(rectangularRack);
		rectangularRack.WellPattern = WellPattern.Irregular;
		rectangularRack.ContainerLayout = ContainerLayout.WellsOnly;
		rectangularRack.RackWells.Clear();
		rectangularRack.IrregularRackBoundaryOffsets.X = 10.0;
		rectangularRack.IrregularRackBoundaryOffsets.Y = 10.0;
		return rectangularRack;
	}

	public static Template CustomTemplate()
	{
		Template obj = new Template
		{
			BackgroundColor = Color.FromArgb(0, 192, 192, 192),
			Dimensions = 
			{
				X = 100.0,
				Y = 100.0,
				Z = 100.0
			}
		};
		obj.Clearance = obj.Dimensions.Z + 5.0;
		return obj;
	}

	public static CircularRack CircularRack()
	{
		return new CircularRack
		{
			UseBoundary = true,
			ContainerLayout = ContainerLayout.WellsOnly,
			BoundaryShape = Shape.Cylinder,
			CircularDefaultSequence = new CircularDefaultSequence
			{
				IncrementDirection = ArcAngleDirection.Clockwise,
				SequenceLabelingFormat = SequenceLabelingFormat.Numeric,
				StartingIndex = 1,
				StartingSegment = Segment.FirstSegment
			},
			Dimensions = new Dimensions(40.0, 40.0, 40.0),
			Clearance = 42.0
		};
	}

	private static void InitializeRackDataTo96Plate(RectangularRack rack)
	{
		rack.WellPattern = WellPattern.Standard96Plate;
		rack.Dimensions.Z = 10.0;
		rack.Clearance = 12.0;
		rack.ContainerLayout = ContainerLayout.SingleContainer;
		rack.BackgroundColor = Color.FromArgb(0, 255, 255, 255);
	}
}
