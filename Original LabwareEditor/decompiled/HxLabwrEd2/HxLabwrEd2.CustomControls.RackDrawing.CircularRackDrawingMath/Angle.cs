using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;

public class Angle : ObservableObject
{
	private double _radians;

	public double Radians
	{
		get
		{
			return _radians;
		}
		set
		{
			if (!Radians.IsApproximatelyEqualTo(value) && ((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Radians), ref _radians, value))
			{
				((ObservableObject)this).RaisePropertyChanged("Degrees");
			}
		}
	}

	public double Degrees
	{
		get
		{
			return _radians * 180.0 / Math.PI;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Radians), ref _radians, value * Math.PI / 180.0);
		}
	}

	private Angle()
	{
	}

	public static Angle FullCircle()
	{
		return FromDegrees(360.0);
	}

	public static Angle Zero()
	{
		return FromDegrees(0.0);
	}

	public static Angle FromRadians(double radians)
	{
		return new Angle
		{
			Radians = radians
		};
	}

	public static Angle FromDegrees(double degrees)
	{
		return new Angle
		{
			Degrees = degrees
		};
	}

	public static Angle FromAngle(Angle angle)
	{
		return FromRadians(angle.Radians);
	}

	public bool IsFullCircle()
	{
		if (this != Zero())
		{
			return (Math.Abs(Degrees) % FullCircle().Degrees).IsApproximatelyEqualTo(0.0);
		}
		return false;
	}

	public static Angle operator +(Angle leftHandSide, Angle rightHandSide)
	{
		return FromRadians(leftHandSide.Radians + rightHandSide.Radians);
	}

	public static Angle operator -(Angle leftHandSide, Angle rightHandSide)
	{
		return FromRadians(leftHandSide.Radians - rightHandSide.Radians);
	}

	public static Angle operator *(Angle angle, int multiplier)
	{
		return FromRadians(angle.Radians * (double)multiplier);
	}

	public static Angle operator *(int multiplier, Angle angle)
	{
		return angle * multiplier;
	}

	public static Angle operator /(Angle angle, int divisor)
	{
		return FromRadians(angle.Radians / (double)divisor);
	}
}
