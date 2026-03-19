using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class WickTouchOff : ViewModelBase
{
	private bool enabled;

	private double height;

	private double front;

	private double right;

	private double back;

	private double left;

	public bool Enabled
	{
		get
		{
			return enabled;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => Enabled), ref enabled, value);
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
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Height), ref height, Math.Round(value, 3, MidpointRounding.AwayFromZero));
		}
	}

	public double Front
	{
		get
		{
			return front;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Front), ref front, Math.Round(value, 3, MidpointRounding.AwayFromZero));
		}
	}

	public double Right
	{
		get
		{
			return right;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Right), ref right, Math.Round(value, 3, MidpointRounding.AwayFromZero));
		}
	}

	public double Back
	{
		get
		{
			return back;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Back), ref back, Math.Round(value, 3, MidpointRounding.AwayFromZero));
		}
	}

	public double Left
	{
		get
		{
			return left;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Left), ref left, Math.Round(value, 3, MidpointRounding.AwayFromZero));
		}
	}
}
