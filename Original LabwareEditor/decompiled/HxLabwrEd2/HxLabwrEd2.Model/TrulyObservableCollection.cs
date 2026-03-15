using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.ComponentModel;

namespace HxLabwrEd2.Model;

public sealed class TrulyObservableCollection<T> : ObservableCollection<T> where T : INotifyPropertyChanged
{
	public TrulyObservableCollection()
	{
		CollectionChanged += FullObservableCollectionCollectionChanged;
	}

	public TrulyObservableCollection(IEnumerable<T> pItems)
		: this()
	{
		foreach (T pItem in pItems)
		{
			Add(pItem);
		}
	}

	private void FullObservableCollectionCollectionChanged(object sender, NotifyCollectionChangedEventArgs e)
	{
		if (e.NewItems != null)
		{
			foreach (INotifyPropertyChanged newItem in e.NewItems)
			{
				newItem.PropertyChanged += ItemPropertyChanged;
			}
		}
		if (e.OldItems == null)
		{
			return;
		}
		foreach (INotifyPropertyChanged oldItem in e.OldItems)
		{
			oldItem.PropertyChanged -= ItemPropertyChanged;
		}
	}

	private void ItemPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		NotifyCollectionChangedEventArgs e2 = new NotifyCollectionChangedEventArgs(NotifyCollectionChangedAction.Replace, sender, sender, IndexOf((T)sender));
		OnCollectionChanged(e2);
	}
}
