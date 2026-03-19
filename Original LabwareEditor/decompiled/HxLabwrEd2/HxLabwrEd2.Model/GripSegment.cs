using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class GripSegment : ObservableObject
{
	private double upperWidth;

	private double lowerWidth;

	private double height;

	public double UpperWidth
	{
		get
		{
			return upperWidth;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => UpperWidth), ref upperWidth, value);
		}
	}

	public double LowerWidth
	{
		get
		{
			return lowerWidth;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => LowerWidth), ref lowerWidth, value);
		}
	}

	public double Height
	{
		get
		{
			return height;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Height), ref height, value);
		}
	}

	public GripSegment()
	{
		UpperWidth = 0.0;
		LowerWidth = 0.0;
		Height = 0.0;
	}

	public GripSegment(GripSegment gripSegment)
	{
		UpperWidth = gripSegment.UpperWidth;
		LowerWidth = gripSegment.LowerWidth;
		Height = gripSegment.Height;
	}
}
