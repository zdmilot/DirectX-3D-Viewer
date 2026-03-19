using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using System.Windows.Controls;
using HxLabwrEd2.ViewModel;

namespace HxLabwrEd2.Validation;

public class FilterNamingValidation : ValidationRule
{
	public DependencyObjectWrapper WrappedAvailableFilters { get; set; }

	public DependencyObjectWrapper WrappedSelectedFilter { get; set; }

	public DependencyObjectWrapper WrappedDialogFilterNamingMode { get; set; }

	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		string text = value.ToString();
		if (string.IsNullOrWhiteSpace(text))
		{
			return new ValidationResult(isValid: false, "Filter name cannot be blank!");
		}
		if (text.Length > 100)
		{
			return new ValidationResult(isValid: false, "Filter name cannot be longer than 100 characters!");
		}
		Regex regex = new Regex("^[a-zA-Z,&0-9-]*$");
		string input = value.ToString().Replace(" ", "");
		if (!regex.IsMatch(input))
		{
			return new ValidationResult(isValid: false, "Filter name must contain only letters A-Z, a-z, numbers 0-9, a comma, or &.");
		}
		if (WrappedAvailableFilters.WrappedObject != null && WrappedSelectedFilter.WrappedObject != null)
		{
			DialogFilterNamingMode num = (DialogFilterNamingMode)WrappedDialogFilterNamingMode.WrappedObject;
			string text2 = WrappedSelectedFilter.WrappedObject.ToString();
			List<string> source = WrappedAvailableFilters.WrappedObject as List<string>;
			if (num == DialogFilterNamingMode.New)
			{
				if (source.Contains(text, StringComparer.OrdinalIgnoreCase))
				{
					return new ValidationResult(isValid: false, "New filter name cannot match any of the existing filter names!");
				}
			}
			else if (text == text2)
			{
				return new ValidationResult(isValid: false, "Filter name cannot match the name of the original filter when using Save As!");
			}
		}
		return new ValidationResult(isValid: true, null);
	}
}
