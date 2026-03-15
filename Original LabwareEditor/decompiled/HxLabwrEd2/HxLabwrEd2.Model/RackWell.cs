using System;
using System.ComponentModel;
using System.Linq;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;

namespace HxLabwrEd2.Model;

public class RackWell : ObservableObject
{
	private string _label;

	private double _centerX;

	private double _centerY;

	private Offsets _containerOffsets;

	private string _containerFilePath;

	private string _containerRelativeFilePath;

	public RackContainer Container => new RackContainer
	{
		FilePath = _containerFilePath,
		RelativeFilePath = _containerRelativeFilePath,
		Offsets = _containerOffsets,
		WellPositionLabel = _label
	};

	public string Label
	{
		get
		{
			return _label;
		}
		set
		{
			if (((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Label), ref _label, value))
			{
				((ObservableObject)this).RaisePropertyChanged("Container");
			}
		}
	}

	public Vector2 Center => Vector2.FromRectangular(CenterX, CenterY);

	public double CenterX
	{
		get
		{
			return _centerX;
		}
		set
		{
			if (((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => CenterX), ref _centerX, value))
			{
				((ObservableObject)this).RaisePropertyChanged("Container");
			}
		}
	}

	public double CenterY
	{
		get
		{
			return _centerY;
		}
		set
		{
			if (((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => CenterY), ref _centerY, value))
			{
				((ObservableObject)this).RaisePropertyChanged("Container");
			}
		}
	}

	public Offsets ContainerOffsets
	{
		get
		{
			return _containerOffsets;
		}
		set
		{
			if (value != _containerOffsets)
			{
				if (_containerOffsets != null)
				{
					((ObservableObject)_containerOffsets).PropertyChanged -= DataChangedDelegate;
				}
				if (((ObservableObject)this).Set<Offsets>((Expression<Func<Offsets>>)(() => ContainerOffsets), ref _containerOffsets, value))
				{
					((ObservableObject)this).RaisePropertyChanged("Container");
				}
				if (_containerOffsets != null)
				{
					((ObservableObject)_containerOffsets).PropertyChanged += DataChangedDelegate;
				}
			}
		}
	}

	public string ContainerFilePath
	{
		get
		{
			return _containerFilePath;
		}
		set
		{
			if (((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => ContainerFilePath), ref _containerFilePath, value))
			{
				((ObservableObject)this).RaisePropertyChanged("Container");
			}
		}
	}

	public string ContainerRelativeFilePath
	{
		get
		{
			return _containerRelativeFilePath;
		}
		set
		{
			if (((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => ContainerRelativeFilePath), ref _containerRelativeFilePath, value))
			{
				((ObservableObject)this).RaisePropertyChanged("Container");
			}
		}
	}

	public bool HasContainer()
	{
		if (string.IsNullOrWhiteSpace(ContainerFilePath))
		{
			return !string.IsNullOrWhiteSpace(ContainerRelativeFilePath);
		}
		return true;
	}

	public RackWell()
	{
		ContainerOffsets = new Offsets();
		Label = "";
		ContainerFilePath = "";
		ContainerRelativeFilePath = "";
	}

	public RackWell(string label)
	{
		ContainerOffsets = new Offsets();
		Label = label;
		ContainerFilePath = "";
		ContainerRelativeFilePath = "";
	}

	public RackWell(IrregularWell irregularWell)
	{
		ContainerOffsets = new Offsets();
		CenterX = irregularWell.CenterX;
		CenterY = irregularWell.CenterY;
		Label = irregularWell.PositionLable;
	}

	public RackWell(RackWell rackWell)
	{
		ContainerOffsets = new Offsets(rackWell.ContainerOffsets);
		ContainerFilePath = rackWell.ContainerFilePath;
		ContainerRelativeFilePath = rackWell.ContainerRelativeFilePath;
		CenterX = rackWell.CenterX;
		CenterY = rackWell.CenterY;
		Label = rackWell.Label;
	}

	private void DataChangedDelegate(object sender, PropertyChangedEventArgs e)
	{
		((ObservableObject)this).PropertyChangedHandler?.Invoke(this, e);
	}

	public static string FindNextDefaultLabel(TrulyObservableCollection<RackWell> rackWellCollection)
	{
		int nextDefaultLabel = 1;
		while (rackWellCollection.FirstOrDefault((RackWell x) => x.Label == nextDefaultLabel.ToString()) != null)
		{
			nextDefaultLabel++;
		}
		return nextDefaultLabel.ToString();
	}
}
