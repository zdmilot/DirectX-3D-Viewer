using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;

namespace HxLabwrEd2.View;

public class CreationCircularRackPropertiesView : UserControl, IComponentConnector
{
	internal CreationCircularRackPropertiesView CreationCircularRackView;

	internal TextBlock TxtBlockHeightUnit;

	internal TextBlock TxtBlockClearanceHeightUnit;

	internal TextBlock TxtBlockStackHeightUnit;

	private bool _contentLoaded;

	public CreationCircularRackPropertiesView()
	{
		InitializeComponent();
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/creationcircularrackpropertiesview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[EditorBrowsable(EditorBrowsableState.Never)]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			CreationCircularRackView = (CreationCircularRackPropertiesView)target;
			break;
		case 2:
			TxtBlockHeightUnit = (TextBlock)target;
			break;
		case 3:
			TxtBlockClearanceHeightUnit = (TextBlock)target;
			break;
		case 4:
			TxtBlockStackHeightUnit = (TextBlock)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
