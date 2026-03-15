using System;
using System.Collections.Generic;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.Converters;

public class CategoryIdToNameConverter : IMultiValueConverter
{
	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		if (values[0] == null || values[0] == DependencyProperty.UnsetValue || values[1] == null || values[1] == DependencyProperty.UnsetValue)
		{
			return string.Empty;
		}
		int num = (int)values[0];
		Dictionary<int, CategoryNode> dictionary = values[1] as Dictionary<int, CategoryNode>;
		if (dictionary.ContainsKey(num))
		{
			return dictionary[num].ViewName;
		}
		return $"Unknown Category ({num})";
	}

	public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
