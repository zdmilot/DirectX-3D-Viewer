using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;

public class Arc : ObservableObject
{
	private Vector2 _centerPoint;

	private Vector2 _relativeStartPoint;

	private Vector2 _relativeEndPoint;

	private Angle _clockwiseAngle;

	private Angle _counterClockwiseAngle;

	public Vector2 CenterPoint
	{
		get
		{
			return _centerPoint;
		}
		set
		{
			((ObservableObject)this).Set<Vector2>((Expression<Func<Vector2>>)(() => CenterPoint), ref _centerPoint, value);
		}
	}

	public Vector2 AbsoluteStartPoint => RelativeStartPoint + CenterPoint;

	public Vector2 AbsoluteEndPoint => RelativeEndPoint + CenterPoint;

	public Vector2 RelativeStartPoint
	{
		get
		{
			return _relativeStartPoint;
		}
		set
		{
			if (((ObservableObject)this).Set<Vector2>((Expression<Func<Vector2>>)(() => RelativeStartPoint), ref _relativeStartPoint, value))
			{
				RecalculateAnglesFromPoints();
			}
		}
	}

	public Vector2 RelativeEndPoint
	{
		get
		{
			return _relativeEndPoint;
		}
		set
		{
			if (((ObservableObject)this).Set<Vector2>((Expression<Func<Vector2>>)(() => RelativeEndPoint), ref _relativeEndPoint, value))
			{
				RecalculateAnglesFromPoints();
			}
		}
	}

	public double Radius
	{
		get
		{
			return RelativeStartPoint.Magnitude;
		}
		set
		{
			if (!RelativeStartPoint.Magnitude.IsApproximatelyEqualTo(value))
			{
				RelativeStartPoint.Magnitude = value;
			}
		}
	}

	public Angle ClockwiseAngle
	{
		get
		{
			return _clockwiseAngle;
		}
		set
		{
			if (((ObservableObject)this).Set<Angle>((Expression<Func<Angle>>)(() => ClockwiseAngle), ref _clockwiseAngle, value))
			{
				_counterClockwiseAngle = Angle.FullCircle() - _clockwiseAngle;
				RecalculateEndPointFromClockwiseAngle();
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
				_clockwiseAngle = Angle.FullCircle() - _counterClockwiseAngle;
				RecalculateEndPointFromClockwiseAngle();
			}
		}
	}

	private Arc()
	{
		_centerPoint = Vector2.Zero();
		_relativeStartPoint = Vector2.Zero();
		_relativeEndPoint = Vector2.Zero();
		_counterClockwiseAngle = Angle.Zero();
		_clockwiseAngle = Angle.Zero();
	}

	public static Arc FromArc(Arc arc)
	{
		return FromRelativePointAndCounterClockwiseAngle(arc.RelativeStartPoint, arc.CounterClockwiseAngle, arc.CenterPoint);
	}

	public static Arc FromAbsolutePoints(Vector2 firstPoint, Vector2 midPoint, Vector2 lastPoint, bool clockwiseIsPositive = false)
	{
		Vector2 vector = Vector2.FromRectangular(firstPoint.X, firstPoint.Y);
		Vector2 vector2 = Vector2.FromRectangular(midPoint.X, midPoint.Y);
		Vector2 vector3 = Vector2.FromRectangular(lastPoint.X, lastPoint.Y);
		Vector2 vector4 = (vector + vector2) / 2;
		Vector2 vector5 = (vector2 + vector3) / 2;
		double num = (vector2.Y - vector.Y) / (vector2.X - vector.X);
		double num2 = (vector2.Y - vector3.Y) / (vector2.X - vector3.X);
		double num3 = 0.0 - 1.0 / num;
		double num4 = 0.0 - 1.0 / num2;
		double num5 = (vector4.X * num3 - vector4.Y - vector5.X * num4 + vector5.Y) / (num3 - num4);
		double y = num5 * num3 - vector4.X * num3 + vector4.Y;
		Vector2 center = Vector2.FromRectangular(num5, y);
		return FromAbsolutePointsAndCenter(firstPoint, lastPoint, center, clockwiseIsPositive);
	}

	public static Arc FromAbsolutePointsAndCenter(Vector2 firstPoint, Vector2 lastPoint, Vector2 center, bool clockwiseIsPositive = false)
	{
		Vector2 vector = firstPoint - center;
		Angle angle = (lastPoint - center).CounterClockwiseAngle - vector.CounterClockwiseAngle;
		angle += ((angle.Degrees < 0.0) ? Angle.FullCircle() : Angle.Zero());
		Angle angle2 = Angle.FullCircle() - angle;
		return FromRelativePointAndCounterClockwiseAngle(vector, angle2, center, clockwiseIsPositive);
	}

	public static Arc FromRelativePointAndCounterClockwiseAngle(Vector2 startPoint, Angle angle, Vector2 centerPoint = null, bool clockwiseIsPositive = false)
	{
		if (centerPoint == null)
		{
			centerPoint = Vector2.Zero();
		}
		return new Arc
		{
			RelativeStartPoint = startPoint,
			CenterPoint = centerPoint,
			CounterClockwiseAngle = (clockwiseIsPositive ? (Angle.FullCircle() - angle) : angle)
		};
	}

	private void RecalculateEndPointFromClockwiseAngle()
	{
		RelativeEndPoint.X = RelativeStartPoint.X;
		RelativeEndPoint.Y = RelativeStartPoint.Y;
		RelativeEndPoint.CounterClockwiseAngle -= ClockwiseAngle;
	}

	private void RecalculateAnglesFromPoints()
	{
		Angle angle = RelativeStartPoint.CounterClockwiseAngle - RelativeEndPoint.CounterClockwiseAngle;
		_clockwiseAngle = angle + ((angle.Degrees < 360.0) ? Angle.FullCircle() : Angle.Zero());
		_counterClockwiseAngle = Angle.FullCircle() - ClockwiseAngle;
		RecalculateEndPointFromClockwiseAngle();
	}

	public List<Vector2> GetEvenlySpacedPointsAlongEdgeRelative(int numberOfPoints, ArcAngleDirection direction)
	{
		if (numberOfPoints < 3)
		{
			throw new ArgumentOutOfRangeException("numberOfPoints");
		}
		Angle angle = ((direction == ArcAngleDirection.Clockwise) ? (ClockwiseAngle * -1) : CounterClockwiseAngle);
		if (angle.IsFullCircle())
		{
			numberOfPoints++;
		}
		List<Vector2> list = new List<Vector2>();
		Angle angle2 = angle / (numberOfPoints - 1);
		foreach (int item in Enumerable.Range(1, numberOfPoints))
		{
			Vector2 vector = RelativeStartPoint.Clone();
			vector.CounterClockwiseAngle += angle2 * (item - 1);
			list.Add(vector);
		}
		if (angle.IsFullCircle())
		{
			list.Remove(list.Last());
		}
		return list;
	}

	public List<Vector2> GetEvenlySpacedAlongEdgeAbsolutePoints(int numberOfPoints, ArcAngleDirection direction)
	{
		return (from position in GetEvenlySpacedPointsAlongEdgeRelative(numberOfPoints, direction)
			select position + CenterPoint).ToList();
	}
}
