using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class Stagger : ObservableObject
{
	private bool enabled;

	private OffsetDirection offsetDirection;

	private double offsetValue;

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

	public OffsetDirection OffsetDirection
	{
		get
		{
			return offsetDirection;
		}
		set
		{
			((ObservableObject)this).Set<OffsetDirection>((Expression<Func<OffsetDirection>>)(() => OffsetDirection), ref offsetDirection, value);
		}
	}

	public double OffsetValue
	{
		get
		{
			return offsetValue;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => OffsetValue), ref offsetValue, value);
		}
	}

	public Stagger()
	{
		OffsetValue = 9.0;
		OffsetDirection = OffsetDirection.In;
		Enabled = false;
	}

	public Stagger(Stagger stagger)
	{
		OffsetValue = stagger.OffsetValue;
		OffsetDirection = stagger.OffsetDirection;
		Enabled = stagger.Enabled;
	}
}
