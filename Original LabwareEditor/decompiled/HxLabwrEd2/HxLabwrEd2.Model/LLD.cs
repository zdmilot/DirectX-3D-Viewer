using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class LLD : ObservableObject
{
	private bool enabled;

	private double seekHeight;

	private Sensitivity sensitivity;

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

	public double SeekHeight
	{
		get
		{
			return seekHeight;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => SeekHeight), ref seekHeight, Math.Round(value, 3, MidpointRounding.AwayFromZero));
		}
	}

	public Sensitivity Sensitivity
	{
		get
		{
			return sensitivity;
		}
		set
		{
			((ObservableObject)this).Set<Sensitivity>((Expression<Func<Sensitivity>>)(() => Sensitivity), ref sensitivity, value);
		}
	}

	public LLD()
	{
		Enabled = false;
		SeekHeight = 0.0;
		Sensitivity = Sensitivity.VeryHigh;
	}
}
