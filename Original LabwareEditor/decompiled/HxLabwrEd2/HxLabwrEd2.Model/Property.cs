using System;
using System.Linq;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class Property : ObservableObject
{
	private string name;

	private string propValue;

	public string Name
	{
		get
		{
			return name;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Name), ref name, value);
		}
	}

	public string Value
	{
		get
		{
			return propValue;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Value), ref propValue, value);
		}
	}

	public static string FindNextDefaultName(TrulyObservableCollection<Property> propertiesCollection)
	{
		int num = 1;
		string text = "Name";
		string nextDefaultName;
		do
		{
			nextDefaultName = text + num++;
		}
		while (propertiesCollection.FirstOrDefault((Property x) => x.Name == nextDefaultName) != null);
		return nextDefaultName;
	}

	public Property()
	{
	}

	public Property(string name, string value)
	{
		Name = name;
		Value = value;
	}
}
