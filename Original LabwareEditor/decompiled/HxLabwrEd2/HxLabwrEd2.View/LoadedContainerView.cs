using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;

namespace HxLabwrEd2.View;

public class LoadedContainerView : UserControl, IComponentConnector
{
	internal Expander ExpanderOne;

	internal Expander ExpanderTwo;

	private bool _contentLoaded;

	public LoadedContainerView()
	{
		InitializeComponent();
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/loadedcontainerview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			ExpanderOne = (Expander)target;
			break;
		case 2:
			ExpanderTwo = (Expander)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
