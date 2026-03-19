using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class IrregularWell : ObservableObject
{
	private string positionLabel;

	private double centerX;

	private double centerY;

	public string PositionLable
	{
		get
		{
			return positionLabel;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => PositionLable), ref positionLabel, value);
		}
	}

	public double CenterX
	{
		get
		{
			return centerX;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => CenterX), ref centerX, value);
		}
	}

	public double CenterY
	{
		get
		{
			return centerY;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => CenterY), ref centerY, value);
		}
	}

	public IrregularWell()
	{
		PositionLable = "";
	}

	public IrregularWell(string DefaultLable)
	{
		PositionLable = DefaultLable;
	}
}
