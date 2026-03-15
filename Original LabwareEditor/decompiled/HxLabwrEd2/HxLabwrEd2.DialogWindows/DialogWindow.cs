using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media;
using Hamilton.Resources.Controls;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.DialogWindows;

public class DialogWindow : HamiltonWindow, IComponentConnector
{
	private readonly double heightProportion;

	private bool isClosed;

	private readonly bool useProportions;

	private object viewReference;

	private readonly double widthProportion;

	internal ContentPresenter ContentPresenter;

	private bool _contentLoaded;

	public DialogWindow(double proportionToParentWidth, double proportionToParentHeight)
	{
		InitializeComponent();
		ContentPresenter.DataContextChanged += DialogPresenterDataContextChanged;
		widthProportion = proportionToParentWidth;
		heightProportion = proportionToParentHeight;
		useProportions = true;
		((Window)this).Closed += DialogWindowClosed;
		((FrameworkElement)this).Loaded += DialogWindowLoaded;
	}

	public DialogWindow(int pixelWidth, int pixelHeight)
	{
		InitializeComponent();
		ContentPresenter.DataContextChanged += DialogPresenterDataContextChanged;
		((FrameworkElement)this).Width = pixelWidth;
		((FrameworkElement)this).Height = pixelHeight;
		useProportions = false;
		((Window)this).Closed += DialogWindowClosed;
		((FrameworkElement)this).Loaded += DialogWindowLoaded;
	}

	~DialogWindow()
	{
		try
		{
			((Window)this).Closed -= DialogWindowClosed;
			((FrameworkElement)this).Loaded -= DialogWindowLoaded;
		}
		finally
		{
			((object)this).Finalize();
		}
	}

	private void DialogWindowLoaded(object sender, RoutedEventArgs e)
	{
		if (useProportions)
		{
			((FrameworkElement)this).Width = Application.Current.MainWindow.ActualWidth * widthProportion;
			((FrameworkElement)this).Height = Application.Current.MainWindow.ActualHeight * heightProportion;
		}
		Rectangle windowRectangle = Application.Current.MainWindow.GetWindowRectangle();
		((Window)this).Left = (double)windowRectangle.Left + ((double)windowRectangle.Width - ((FrameworkElement)this).Width) / 2.0;
		((Window)this).Top = (double)windowRectangle.Top + ((double)windowRectangle.Height - ((FrameworkElement)this).Height) / 2.0;
		viewReference = VisualTreeHelper.GetChild(ContentPresenter, 0);
	}

	private void DialogWindowClosed(object sender, EventArgs e)
	{
		(viewReference as FrameworkElement).DataContext = null;
		isClosed = true;
		((Window)this).Owner?.Focus();
	}

	private void DialogPresenterDataContextChanged(object sender, DependencyPropertyChangedEventArgs e)
	{
		IDialogResultVMHelper d = e.NewValue as IDialogResultVMHelper;
		if (d != null)
		{
			d.RequestCloseDialog += EventHandlerUtils.MakeWeak(DialogResultTrueEvent, delegate(EventHandler<RequestCloseDialogEventArgs> x)
			{
				d.RequestCloseDialog -= x;
			});
		}
	}

	private void DialogResultTrueEvent(object sender, RequestCloseDialogEventArgs eventargs)
	{
		if (!isClosed)
		{
			((Window)this).DialogResult = eventargs.DialogResult;
		}
	}

	private void DialogWindowKeyDown(object sender, KeyEventArgs e)
	{
		if (e.Key == Key.System && e.SystemKey == Key.F4)
		{
			e.Handled = true;
		}
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/dialog%20windows/dialogwindow.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[EditorBrowsable(EditorBrowsableState.Never)]
	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			((UIElement)(object)(DialogWindow)target).KeyDown += DialogWindowKeyDown;
			((Window)(object)(DialogWindow)target).Closed += DialogWindowClosed;
			break;
		case 2:
			ContentPresenter = (ContentPresenter)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
