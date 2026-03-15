using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class SegmentSettings : ObservableObject
{
	private const int Precision = 2;

	private double _clockwiseArcAngle;

	private int _numberOfWells;

	private double _radius;

	private double _startingAngle;

	public int NumberOfWells
	{
		get
		{
			return _numberOfWells;
		}
		set
		{
			((ObservableObject)this).Set<int>((Expression<Func<int>>)(() => NumberOfWells), ref _numberOfWells, value);
		}
	}

	public double Radius
	{
		get
		{
			return Math.Round(_radius, 2, MidpointRounding.AwayFromZero);
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Radius), ref _radius, value);
		}
	}

	public double ClockwiseArcAngle
	{
		get
		{
			return Math.Round(_clockwiseArcAngle, 2, MidpointRounding.AwayFromZero);
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => ClockwiseArcAngle), ref _clockwiseArcAngle, value);
		}
	}

	public double StartingAngle
	{
		get
		{
			return Math.Round(_startingAngle, 2, MidpointRounding.AwayFromZero);
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => StartingAngle), ref _startingAngle, value);
		}
	}

	public SegmentSettings()
	{
		NumberOfWells = 8;
		Radius = 10.0;
		ClockwiseArcAngle = 360.0;
		StartingAngle = 0.0;
	}

	public SegmentSettings(int numberOfWells, double radius, double clockwiseArcAngle, double startingAngle)
	{
		NumberOfWells = numberOfWells;
		Radius = radius;
		ClockwiseArcAngle = clockwiseArcAngle;
		StartingAngle = startingAngle;
	}

	public SegmentSettings(SegmentSettings settings)
	{
		NumberOfWells = settings.NumberOfWells;
		Radius = settings.Radius;
		ClockwiseArcAngle = settings.ClockwiseArcAngle;
		StartingAngle = settings.StartingAngle;
	}
}
