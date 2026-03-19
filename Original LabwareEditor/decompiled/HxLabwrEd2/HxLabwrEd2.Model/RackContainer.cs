using System;
using System.ComponentModel;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class RackContainer : ObservableObject
{
	private Offsets offsets;

	private string filePath;

	private string relativeFilePath;

	private string wellPositionLabel;

	public Offsets Offsets
	{
		get
		{
			return offsets;
		}
		set
		{
			if (value != offsets)
			{
				if (offsets != null)
				{
					((ObservableObject)offsets).PropertyChanged -= DataChangedDelegate;
				}
				((ObservableObject)this).Set<Offsets>((Expression<Func<Offsets>>)(() => Offsets), ref offsets, value);
				if (offsets != null)
				{
					((ObservableObject)offsets).PropertyChanged += DataChangedDelegate;
				}
			}
		}
	}

	public string FilePath
	{
		get
		{
			return filePath;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => FilePath), ref filePath, value);
		}
	}

	public string RelativeFilePath
	{
		get
		{
			return relativeFilePath;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => RelativeFilePath), ref relativeFilePath, value);
		}
	}

	public string WellPositionLabel
	{
		get
		{
			return wellPositionLabel;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => WellPositionLabel), ref wellPositionLabel, value);
		}
	}

	private void DataChangedDelegate(object sender, PropertyChangedEventArgs e)
	{
		((ObservableObject)this).PropertyChangedHandler?.Invoke(this, e);
	}

	public RackContainer()
	{
		offsets = new Offsets();
		filePath = "";
		relativeFilePath = "";
		wellPositionLabel = "";
	}

	public RackContainer(RackContainer rackContainer)
	{
		Offsets = new Offsets(rackContainer.Offsets);
		FilePath = rackContainer.FilePath;
		RelativeFilePath = rackContainer.RelativeFilePath;
		WellPositionLabel = rackContainer.WellPositionLabel;
	}

	~RackContainer()
	{
		try
		{
			if (Offsets != null)
			{
				((ObservableObject)Offsets).PropertyChanged -= DataChangedDelegate;
			}
		}
		finally
		{
			((object)this).Finalize();
		}
	}
}
