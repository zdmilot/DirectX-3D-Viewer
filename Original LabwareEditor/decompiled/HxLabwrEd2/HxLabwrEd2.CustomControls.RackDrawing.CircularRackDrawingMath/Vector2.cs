using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;

public class Vector2 : ObservableObject
{
	private Angle _counterClockwiseAngle;

	private double _magnitude;

	private double _x;

	private double _y;

	public double X
	{
		get
		{
			return _x;
		}
		set
		{
			if (((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => X), ref _x, value))
			{
				RecalculatePolar();
			}
		}
	}

	public double Y
	{
		get
		{
			return _y;
		}
		set
		{
			if (((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Y), ref _y, value))
			{
				RecalculatePolar();
			}
		}
	}

	public Angle CounterClockwiseAngle
	{
		get
		{
			return _counterClockwiseAngle;
		}
		set
		{
			if (((ObservableObject)this).Set<Angle>((Expression<Func<Angle>>)(() => CounterClockwiseAngle), ref _counterClockwiseAngle, value))
			{
				RecalculateRectangular();
			}
		}
	}

	public double Magnitude
	{
		get
		{
			return _magnitude;
		}
		set
		{
			if (!Magnitude.IsApproximatelyEqualTo(value) && ((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Magnitude), ref _magnitude, value))
			{
				RecalculateRectangular();
			}
		}
	}

	private Vector2()
	{
		CounterClockwiseAngle = Angle.Zero();
	}

	public static Vector2 Zero()
	{
		return FromRectangular(0.0, 0.0);
	}

	public static Vector2 FromVector2(Vector2 vector)
	{
		return FromRectangular(vector.X, vector.Y);
	}

	public static Vector2 FromRectangular(double x, double y)
	{
		return new Vector2
		{
			X = x,
			Y = y
		};
	}

	public static Vector2 FromPolar(Angle angle, double magnitude)
	{
		return new Vector2
		{
			CounterClockwiseAngle = angle,
			Magnitude = magnitude
		};
	}

	public Vector2 Clone()
	{
		return FromVector2(this);
	}

	public Vector2 Inverse()
	{
		return FromVector2(this * -1.0);
	}

	private void RecalculatePolar()
	{
		_magnitude = Math.Sqrt(Math.Pow(X, 2.0) + Math.Pow(Y, 2.0));
		_counterClockwiseAngle.Radians = Math.Atan2(Y, X);
		_counterClockwiseAngle.Radians += ((CounterClockwiseAngle.Radians < 0.0) ? (Math.PI * 2.0) : 0.0);
	}

	private void RecalculateRectangular()
	{
		_x = Magnitude * Math.Cos(CounterClockwiseAngle.Radians);
		_y = Magnitude * Math.Sin(CounterClockwiseAngle.Radians);
	}

	public static Vector2 operator +(Vector2 leftHandSide, Vector2 rightHandSide)
	{
		return FromRectangular(leftHandSide.X + rightHandSide.X, leftHandSide.Y + rightHandSide.Y);
	}

	public static Vector2 operator -(Vector2 leftHandSide, Vector2 rightHandSide)
	{
		return FromRectangular(leftHandSide.X - rightHandSide.X, leftHandSide.Y - rightHandSide.Y);
	}

	public static Vector2 operator *(Vector2 leftHandSide, double scalar)
	{
		return FromRectangular(scalar * leftHandSide.X, scalar * leftHandSide.Y);
	}

	public static Vector2 operator *(double scalar, Vector2 rightHandSide)
	{
		return rightHandSide * scalar;
	}

	public static Vector2 operator /(Vector2 leftHandSide, int divisor)
	{
		return FromRectangular(leftHandSide.X / (double)divisor, leftHandSide.Y / (double)divisor);
	}

	public static Vector2 operator /(Vector2 leftHandSide, Vector2 rightHandSide)
	{
		return FromRectangular(leftHandSide.X / rightHandSide.X, leftHandSide.Y / rightHandSide.Y);
	}

	public double Dot(Vector2 rightHandSide)
	{
		return X * rightHandSide.X + Y * rightHandSide.Y;
	}
}
