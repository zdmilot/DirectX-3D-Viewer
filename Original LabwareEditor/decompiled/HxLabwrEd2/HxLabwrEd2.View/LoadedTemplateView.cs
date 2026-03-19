using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;

namespace HxLabwrEd2.View;

public class LoadedTemplateView : UserControl, IComponentConnector
{
	internal Expander ExpanderOne;

	internal Expander ExpanderTwo;

	internal Expander ExpanderThree;

	private bool _contentLoaded;

	public LoadedTemplateView()
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
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/loadedtemplateview.xaml", UriKind.Relative);
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
			ExpanderOne = (Expander)target;
			break;
		case 2:
			ExpanderTwo = (Expander)target;
			break;
		case 3:
			ExpanderThree = (Expander)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
