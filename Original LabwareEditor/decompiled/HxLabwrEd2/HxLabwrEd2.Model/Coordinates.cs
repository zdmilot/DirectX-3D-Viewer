using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class Coordinates : ObservableObject
{
	private double x;

	private double y;

	private double z;

	public double X
	{
		get
		{
			return x;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => X), ref x, value);
		}
	}

	public double Y
	{
		get
		{
			return y;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Y), ref y, value);
		}
	}

	public double Z
	{
		get
		{
			return z;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Z), ref z, value);
		}
	}

	public Coordinates()
	{
		X = 0.0;
		Y = 0.0;
		Z = 0.0;
	}

	public Coordinates(double x, double y, double z)
	{
		X = x;
		Y = y;
		Z = z;
	}

	public Coordinates(double x, double y)
	{
		X = x;
		Y = y;
		Z = 0.0;
	}

	public Coordinates(Coordinates coordinates)
	{
		X = coordinates.X;
		Y = coordinates.Y;
		Z = coordinates.Z;
	}
}
