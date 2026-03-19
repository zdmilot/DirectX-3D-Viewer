using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Windows.Media.Imaging;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class PedestalSelector : ObservableObject
{
	private List<Tuple<string, string, BitmapImage, string>> availablePedestals;

	private Tuple<string, string, BitmapImage, string> selected;

	private bool isEnabled;

	private string header;

	public Tuple<string, string, BitmapImage, string> Selected
	{
		get
		{
			return selected;
		}
		set
		{
			((ObservableObject)this).Set<Tuple<string, string, BitmapImage, string>>((Expression<Func<Tuple<string, string, BitmapImage, string>>>)(() => Selected), ref selected, value);
		}
	}

	public int PedestalPosition { get; }

	public List<Tuple<string, string, BitmapImage, string>> AvailablePedestals
	{
		get
		{
			return availablePedestals;
		}
		private set
		{
			((ObservableObject)this).Set<List<Tuple<string, string, BitmapImage, string>>>((Expression<Func<List<Tuple<string, string, BitmapImage, string>>>>)(() => AvailablePedestals), ref availablePedestals, value);
		}
	}

	public bool IsEnabled
	{
		get
		{
			return isEnabled;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => IsEnabled), ref isEnabled, value);
		}
	}

	public string Header
	{
		get
		{
			return header;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Header), ref header, value);
		}
	}

	public PedestalSelector(int pedestalPosition, List<Tuple<string, string, BitmapImage, string>> pedestals)
	{
		PedestalPosition = pedestalPosition;
		Header = $"Position {PedestalPosition}";
		AvailablePedestals = pedestals;
		Selected = pedestals[0];
		IsEnabled = true;
	}

	public void BlockSelector(int blockerSelectorPosition)
	{
		IsEnabled = false;
		string text = (Header = $"Position {PedestalPosition} (blocked by pedestal in Position {blockerSelectorPosition})");
		Header = text;
	}

	public void UnblockSelector()
	{
		IsEnabled = true;
		string text = (Header = $"Position {PedestalPosition}");
		Header = text;
	}
}
