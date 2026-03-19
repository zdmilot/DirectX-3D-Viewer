using System;
using System.Globalization;
using System.Windows.Data;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.Converters;

public class FileValidationToStringConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if ((FileValidation)value == FileValidation.Valid)
		{
			return "Validated";
		}
		return "Not Validated";
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
