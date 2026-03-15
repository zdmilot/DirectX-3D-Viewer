using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class RectangularDefaultSequence : ObservableObject
{
	private int userStartValue;

	private IncrementDirection incrementDirection;

	private bool useDefaultStartValue;

	private Corner startCorner;

	public static readonly string DefaultStartValue = "A1";

	public int UserStartValue
	{
		get
		{
			return userStartValue;
		}
		set
		{
			((ObservableObject)this).Set<int>((Expression<Func<int>>)(() => UserStartValue), ref userStartValue, value);
		}
	}

	public IncrementDirection IncrementDirection
	{
		get
		{
			return incrementDirection;
		}
		set
		{
			((ObservableObject)this).Set<IncrementDirection>((Expression<Func<IncrementDirection>>)(() => IncrementDirection), ref incrementDirection, value);
		}
	}

	public bool UseDefaultStartValue
	{
		get
		{
			return useDefaultStartValue;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => UseDefaultStartValue), ref useDefaultStartValue, value);
		}
	}

	public Corner StartCorner
	{
		get
		{
			return startCorner;
		}
		set
		{
			((ObservableObject)this).Set<Corner>((Expression<Func<Corner>>)(() => StartCorner), ref startCorner, value);
		}
	}

	public RectangularDefaultSequence()
	{
		StartCorner = Corner.BackLeft;
		IncrementDirection = IncrementDirection.RowFirst;
		UseDefaultStartValue = true;
		UserStartValue = 1;
	}

	public RectangularDefaultSequence(RectangularDefaultSequence rectangularDefaultSequence)
	{
		StartCorner = rectangularDefaultSequence.StartCorner;
		IncrementDirection = rectangularDefaultSequence.IncrementDirection;
		UseDefaultStartValue = rectangularDefaultSequence.UseDefaultStartValue;
		UserStartValue = rectangularDefaultSequence.UserStartValue;
	}
}
