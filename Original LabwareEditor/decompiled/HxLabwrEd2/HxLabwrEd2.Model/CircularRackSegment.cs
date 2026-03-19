using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;

namespace HxLabwrEd2.Model;

public class CircularRackSegment : ObservableObject
{
	private Arc _arc;

	private int _holeCount;

	public Arc Arc
	{
		get
		{
			return _arc;
		}
		set
		{
			((ObservableObject)this).Set<Arc>((Expression<Func<Arc>>)(() => Arc), ref _arc, value);
		}
	}

	public int HoleCount
	{
		get
		{
			return _holeCount;
		}
		set
		{
			((ObservableObject)this).Set<int>((Expression<Func<int>>)(() => HoleCount), ref _holeCount, value);
		}
	}

	public CircularRackSegment()
	{
	}

	public CircularRackSegment(CircularRackSegment segment)
	{
		Arc = Arc.FromArc(segment.Arc);
		HoleCount = segment.HoleCount;
	}
}
