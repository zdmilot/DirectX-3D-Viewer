using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Linq;
using System.Runtime.CompilerServices;

namespace HxLabwrEd2.Model;

public class ObservableCollectionPropertyChangedListener<T> : INotifyPropertyChanged where T : INotifyPropertyChanged
{
	private class ObjectIdentityComparer : IEqualityComparer<T>
	{
		public bool Equals(T x, T y)
		{
			return (object)x == (object)y;
		}

		public int GetHashCode(T obj)
		{
			return RuntimeHelpers.GetHashCode(obj);
		}
	}

	private readonly ObservableCollection<T> _collection;

	private readonly Dictionary<T, int> _items = new Dictionary<T, int>(new ObjectIdentityComparer());

	private readonly string _propertyName;

	public event PropertyChangedEventHandler PropertyChanged;

	public ObservableCollectionPropertyChangedListener(ObservableCollection<T> collection, string propertyName = "")
	{
		_collection = collection;
		_propertyName = propertyName ?? "";
		AddRange(collection);
		CollectionChangedEventManager.AddHandler(collection, CollectionChanged);
	}

	private void CollectionChanged(object sender, NotifyCollectionChangedEventArgs e)
	{
		switch (e.Action)
		{
		case NotifyCollectionChangedAction.Add:
			AddRange(e.NewItems.Cast<T>());
			break;
		case NotifyCollectionChangedAction.Remove:
			RemoveRange(e.OldItems.Cast<T>());
			break;
		case NotifyCollectionChangedAction.Replace:
			AddRange(e.NewItems.Cast<T>());
			RemoveRange(e.OldItems.Cast<T>());
			break;
		case NotifyCollectionChangedAction.Reset:
			Reset();
			break;
		default:
			throw new ArgumentOutOfRangeException();
		case NotifyCollectionChangedAction.Move:
			break;
		}
	}

	private void AddRange(IEnumerable<T> newItems)
	{
		foreach (T newItem in newItems)
		{
			if (_items.ContainsKey(newItem))
			{
				_items[newItem]++;
				continue;
			}
			_items.Add(newItem, 1);
			PropertyChangedEventManager.AddHandler(newItem, ChildPropertyChanged, _propertyName);
		}
	}

	private void RemoveRange(IEnumerable<T> oldItems)
	{
		foreach (T oldItem in oldItems)
		{
			_items[oldItem]--;
			if (_items[oldItem] == 0)
			{
				_items.Remove(oldItem);
				PropertyChangedEventManager.RemoveHandler(oldItem, ChildPropertyChanged, _propertyName);
			}
		}
	}

	private void Reset()
	{
		foreach (T item in _items.Keys.ToList())
		{
			PropertyChangedEventManager.RemoveHandler(item, ChildPropertyChanged, _propertyName);
			_items.Remove(item);
		}
		AddRange(_collection);
	}

	protected virtual void ChildPropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		this.PropertyChanged?.Invoke(sender, e);
	}
}
public static class ObservableCollectionPropertyChangedListener
{
	public static ObservableCollectionPropertyChangedListener<T> Create<T>(ObservableCollection<T> collection, string propertyName = "") where T : INotifyPropertyChanged
	{
		return new ObservableCollectionPropertyChangedListener<T>(collection, propertyName);
	}
}
