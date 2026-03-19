using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class CircularDefaultSequence : ObservableObject
{
	private ArcAngleDirection _incrementDirection;

	private SequenceLabelingFormat _sequenceLabelingFormat;

	private int _startingIndex;

	private Segment _startingSegment;

	public int StartingIndex
	{
		get
		{
			return _startingIndex;
		}
		set
		{
			((ObservableObject)this).Set<int>((Expression<Func<int>>)(() => StartingIndex), ref _startingIndex, value);
		}
	}

	public ArcAngleDirection IncrementDirection
	{
		get
		{
			return _incrementDirection;
		}
		set
		{
			((ObservableObject)this).Set<ArcAngleDirection>((Expression<Func<ArcAngleDirection>>)(() => IncrementDirection), ref _incrementDirection, value);
		}
	}

	public SequenceLabelingFormat SequenceLabelingFormat
	{
		get
		{
			return _sequenceLabelingFormat;
		}
		set
		{
			((ObservableObject)this).Set<SequenceLabelingFormat>((Expression<Func<SequenceLabelingFormat>>)(() => SequenceLabelingFormat), ref _sequenceLabelingFormat, value);
		}
	}

	public Segment StartingSegment
	{
		get
		{
			return _startingSegment;
		}
		set
		{
			((ObservableObject)this).Set<Segment>((Expression<Func<Segment>>)(() => StartingSegment), ref _startingSegment, value);
		}
	}

	public CircularDefaultSequence()
	{
		StartingIndex = 1;
		IncrementDirection = ArcAngleDirection.Clockwise;
		SequenceLabelingFormat = SequenceLabelingFormat.Numeric;
		StartingSegment = Segment.FirstSegment;
	}

	public CircularDefaultSequence(CircularDefaultSequence sequence)
	{
		StartingIndex = sequence.StartingIndex;
		IncrementDirection = sequence.IncrementDirection;
		SequenceLabelingFormat = sequence.SequenceLabelingFormat;
		StartingSegment = sequence.StartingSegment;
	}
}
