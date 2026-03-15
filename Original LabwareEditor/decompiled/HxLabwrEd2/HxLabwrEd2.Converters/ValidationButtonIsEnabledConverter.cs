using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.Converters;

internal class ValidationButtonIsEnabledConverter : IMultiValueConverter
{
	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		if (values[0] == DependencyProperty.UnsetValue || values[1] == DependencyProperty.UnsetValue || values[2] == DependencyProperty.UnsetValue)
		{
			return false;
		}
		bool flag = System.Convert.ToBoolean(values[0]);
		FileValidation fileValidation = (FileValidation)Enum.Parse(typeof(FileValidation), values[1].ToString());
		if (!System.Convert.ToBoolean(values[2]) && flag && fileValidation == FileValidation.Invalid)
		{
			return true;
		}
		return false;
	}

	public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
