using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using Hamilton.Interop.HxCfgFil;
using HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;
using HxLabwrEd2.Extensions;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.Model;

public class CircularRack : Rack
{
	private ObservableCollection<CircularRackSegment> _segments;

	private CircularDefaultSequence _circularDefaultSequence;

	public double LargestRadius => Segments.Select((CircularRackSegment segment) => segment.Arc.Radius).Max();

	public ObservableCollection<CircularRackSegment> Segments
	{
		get
		{
			return _segments;
		}
		set
		{
			((ObservableObject)this).Set<ObservableCollection<CircularRackSegment>>((Expression<Func<ObservableCollection<CircularRackSegment>>>)(() => Segments), ref _segments, value);
		}
	}

	public Vector2 Center => Segments.First().Arc.CenterPoint;

	public CircularDefaultSequence CircularDefaultSequence
	{
		get
		{
			return _circularDefaultSequence;
		}
		set
		{
			if (!((ObservableObject)this).Set<CircularDefaultSequence>((Expression<Func<CircularDefaultSequence>>)(() => CircularDefaultSequence), ref _circularDefaultSequence, value) || !Segments.Any())
			{
				return;
			}
			CircularRackSegment circularRackSegment = ReferenceSegment();
			Vector2 vector = RelativeReferencePoint();
			circularRackSegment.Arc.CenterPoint = vector.Inverse();
			foreach (CircularRackSegment segment in Segments)
			{
				segment.Arc.CenterPoint = circularRackSegment.Arc.CenterPoint;
			}
		}
	}

	public CircularRack()
	{
		Segments = new ObservableCollection<CircularRackSegment>();
		CircularDefaultSequence = new CircularDefaultSequence();
		boundaryOffsets.X = 10.0;
		boundaryOffsets.Y = 10.0;
	}

	public CircularRack(CircularRack circularRack)
		: base(circularRack)
	{
		Segments = new ObservableCollection<CircularRackSegment>();
		CircularDefaultSequence = new CircularDefaultSequence(circularRack.CircularDefaultSequence);
		foreach (CircularRackSegment segment in circularRack.Segments)
		{
			Segments.Add(segment);
		}
	}

	public void AssignSmallestPossibleBoundary(Shape shape = Shape.Cylinder)
	{
		if (shape != Shape.Rectangle && shape != Shape.Cylinder)
		{
			throw new ArgumentException("The desired boundary shape to generate for the current circular rack must be either a cylinder or rectangle.");
		}
		base.UseBoundary = true;
		base.Dimensions.X = 0.0;
		base.Dimensions.Y = 0.0;
		base.BoundaryOffsets.X = 0.0;
		base.BoundaryOffsets.Y = 0.0;
		GetOutermostSegmentRingRectangularBoundary(out var minX, out var maxX, out var minY, out var maxY, 1.3);
		base.Dimensions.X = Math.Abs(minX) + Math.Abs(maxX);
		base.Dimensions.Y = Math.Abs(minY) + Math.Abs(maxY);
		base.BoundaryOffsets.X = Math.Abs(minX);
		base.BoundaryOffsets.Y = Math.Abs(minY);
		base.BoundaryShape = shape;
	}

	public void GetOutermostSegmentRingRectangularBoundary(out double minX, out double maxX, out double minY, out double maxY, double scalingFactor = 1.0)
	{
		double largestRadius = LargestRadius;
		minX = Center.X - largestRadius * scalingFactor;
		maxX = Center.X + largestRadius * scalingFactor;
		minY = Center.Y - largestRadius * scalingFactor;
		maxY = Center.Y + largestRadius * scalingFactor;
	}

	public List<RackWell> CorrespondingRackWells(CircularRackSegment segment)
	{
		if (!base.RackWells.Any() || !Segments.Any() || !Segments.Contains(segment))
		{
			return null;
		}
		return base.RackWells.Skip(CorrespondingStartingRackWellIndex(segment)).Take(segment.HoleCount).ToList();
	}

	public int CorrespondingStartingRackWellIndex(CircularRackSegment segment)
	{
		return Segments.TakeWhile((CircularRackSegment currentSegment) => currentSegment != segment).Sum((CircularRackSegment currentSegment) => currentSegment.HoleCount);
	}

	public CircularRackSegment ReferenceSegment()
	{
		if (CircularDefaultSequence.StartingSegment != Segment.FirstSegment)
		{
			return Segments.Last();
		}
		return Segments.First();
	}

	public Vector2 RelativeReferencePoint()
	{
		CircularRackSegment circularRackSegment = ReferenceSegment();
		if (CircularDefaultSequence.IncrementDirection != ArcAngleDirection.Clockwise)
		{
			return circularRackSegment.Arc.RelativeEndPoint;
		}
		return circularRackSegment.Arc.RelativeStartPoint;
	}

	public Vector2 AbsoluteReferencePoint()
	{
		CircularRackSegment circularRackSegment = ReferenceSegment();
		if (CircularDefaultSequence.IncrementDirection != ArcAngleDirection.Clockwise)
		{
			return circularRackSegment.Arc.AbsoluteEndPoint;
		}
		return circularRackSegment.Arc.AbsoluteStartPoint;
	}

	public void TranslateReferencePointToOrigin()
	{
		if (!Segments.Any())
		{
			return;
		}
		Vector2 vector = AbsoluteReferencePoint();
		foreach (CircularRackSegment segment in Segments)
		{
			segment.Arc.CenterPoint -= vector;
		}
	}

	public override void GenerateRackWells(List<RackContainer> rackContainers)
	{
		GenerateLabeledRackWells();
		Dictionary<string, RackContainer> dictionary = (from container in rackContainers
			group container by container.WellPositionLabel).ToDictionary((IGrouping<string, RackContainer> g) => g.Key, (IGrouping<string, RackContainer> g) => g.First());
		if (base.ContainerLayout == ContainerLayout.SingleContainer)
		{
			RackContainer value = dictionary.First().Value;
			{
				foreach (RackWell rackWell in base.RackWells)
				{
					rackWell.ContainerFilePath = value.FilePath;
					rackWell.ContainerRelativeFilePath = value.RelativeFilePath;
					rackWell.ContainerOffsets = value.Offsets;
				}
				return;
			}
		}
		if (base.ContainerLayout != ContainerLayout.MultipleContainers)
		{
			return;
		}
		foreach (RackWell rackWell2 in base.RackWells)
		{
			if (dictionary.ContainsKey(rackWell2.Label))
			{
				RackContainer rackContainer = dictionary[rackWell2.Label];
				rackWell2.ContainerFilePath = rackContainer.FilePath;
				rackWell2.ContainerRelativeFilePath = rackContainer.RelativeFilePath;
				rackWell2.ContainerOffsets = rackContainer.Offsets;
			}
		}
	}

	public void GenerateLabeledRackWells()
	{
		base.RackWells.Clear();
		if (Segments.Any())
		{
			Segments.SelectMany((CircularRackSegment segment) => segment.Arc.GetEvenlySpacedAlongEdgeAbsolutePoints(segment.HoleCount, ArcAngleDirection.Clockwise)).ToList().ForEach(delegate(Vector2 position)
			{
				base.RackWells.Add(new RackWell
				{
					CenterX = position.X,
					CenterY = position.Y
				});
			});
			ApplySequenceLabels();
		}
	}

	private void ApplySequenceLabels()
	{
		int currentIndex = CircularDefaultSequence.StartingIndex;
		string alphaValue = "A";
		bool num = CircularDefaultSequence.StartingSegment == Segment.FirstSegment;
		bool incrementCounterClockwise = CircularDefaultSequence.IncrementDirection == ArcAngleDirection.CounterClockwise;
		(num ? Segments.ToList() : Segments.Reverse().ToList()).Select(CorrespondingRackWells).ToList().ForEach(delegate(List<RackWell> rackWells)
		{
			if (incrementCounterClockwise)
			{
				rackWells.Reverse();
			}
			string segmentLetter = alphaValue;
			rackWells.Each(delegate(RackWell rackWell, int index)
			{
				switch (CircularDefaultSequence.SequenceLabelingFormat)
				{
				case SequenceLabelingFormat.Numeric:
				{
					int num2 = currentIndex;
					currentIndex = num2 + 1;
					rackWell.Label = $"{num2}";
					break;
				}
				case SequenceLabelingFormat.AlphanumericStartingWithIndexA1:
					rackWell.Label = $"{segmentLetter}{index + 1}";
					break;
				default:
					throw new ArgumentOutOfRangeException();
				}
			});
			if (incrementCounterClockwise)
			{
				rackWells.Reverse();
			}
			alphaValue = AlphaValueHelper.IncrementAlphaValue(alphaValue);
		});
	}

	public override void ReadDefaultSequenceData(HxCfgFile configFile)
	{
		Func<string, short> lookupShort = delegate(string key)
		{
			try
			{
				return configFile.GetDataDefValueAsShort("CIRCRACK", "default", key);
			}
			catch
			{
				return 0;
			}
		};
		Func<string, bool> func = (string key) => lookupShort(key) == 1;
		CircularDefaultSequence = new CircularDefaultSequence
		{
			IncrementDirection = (func("IX.Inc") ? ArcAngleDirection.CounterClockwise : ArcAngleDirection.Clockwise),
			StartingSegment = (func("IX.Start") ? Segment.LastSegment : Segment.FirstSegment),
			SequenceLabelingFormat = (func("IX.Index") ? SequenceLabelingFormat.AlphanumericStartingWithIndexA1 : SequenceLabelingFormat.Numeric),
			StartingIndex = lookupShort("IX.First")
		};
	}

	private void DetermineLoadedDrawContainerBoundary(DrawContainer drawContainer, HxCfgFile labwareConfigFile)
	{
		Func<string, short> func = delegate(string key)
		{
			try
			{
				return labwareConfigFile.GetDataDefValueAsShort("CONTAINER", "default", key);
			}
			catch
			{
				return 0;
			}
		};
		Func<string, double> func2 = delegate(string key)
		{
			try
			{
				return labwareConfigFile.GetDataDefValueAsDouble("CONTAINER", "default", key);
			}
			catch
			{
				return 0.0;
			}
		};
		drawContainer.Shape = (Shape)func($"{1}.Shape");
		switch (drawContainer.Shape)
		{
		case Shape.Cylinder:
		case Shape.RoundBase:
		case Shape.VConeBase:
			drawContainer.Shape = Shape.Cylinder;
			drawContainer.Dimensions.Z = func2($"{1}.DZ");
			break;
		case Shape.Rectangle:
			drawContainer.Shape = Shape.Rectangle;
			drawContainer.Dimensions.X = func2($"{1}.DX");
			drawContainer.Dimensions.Y = func2($"{1}.DY");
			break;
		case Shape.InvertedVCone:
		case Shape.VCone:
		case Shape.FlatBase:
			drawContainer.Shape = Shape.Cylinder;
			drawContainer.Dimensions.Z = func2($"{1}.DX");
			break;
		default:
			throw new ArgumentOutOfRangeException();
		}
	}

	private static void HandleDrawContainerError(string error, DrawContainer drawContainer)
	{
		drawContainer.FileStatus = FileOpeningStatus.Error;
		if (error.Contains("An error occurred while running Vector."))
		{
			int num = error.IndexOf(':');
			int num2 = error.IndexOf(')');
			string text = error.Substring(num + 1, num2 - num);
			drawContainer.FileStatusError = text.Replace("\n", string.Empty);
		}
		else
		{
			drawContainer.FileStatusError = error;
		}
	}

	protected override void OnUpdateContainerLayout(ContainerLayout containerLayout)
	{
		if (!base.Loading)
		{
			UpdateRackWellContainers(containerLayout);
		}
	}

	protected override void OnRegenerateRackWells()
	{
		GenerateLabeledRackWells();
	}
}
