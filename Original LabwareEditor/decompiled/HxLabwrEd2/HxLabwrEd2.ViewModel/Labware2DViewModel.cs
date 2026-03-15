using System;
using System.Linq.Expressions;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Shapes;
using System.Windows.Threading;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.CustomControls.ContainerSegments;
using HxLabwrEd2.CustomControls.RackDrawing;
using HxLabwrEd2.CustomControls.TemplateDrawing;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.ViewModel;

public class Labware2DViewModel : ViewModelBase
{
	private object drawingSurface;

	public object DrawingSurface
	{
		get
		{
			return drawingSurface;
		}
		set
		{
			((ObservableObject)this).Set<object>((Expression<Func<object>>)(() => DrawingSurface), ref drawingSurface, value);
		}
	}

	public Labware2DViewModel()
	{
		Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"Draw2DLabware", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
		{
			Draw(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"Clear2DDrawing", (Action<NotificationMessage>)delegate
		{
			DrawingSurface = null;
		}, false);
	}

	~Labware2DViewModel()
	{
		try
		{
			Messenger.Default.Unregister((object)this);
		}
		finally
		{
			((object)this).Finalize();
		}
	}

	private void Draw(Labware labware)
	{
		if (labware is Template template)
		{
			DrawTemplate(template);
		}
		else if (labware is RectangularRack)
		{
			DrawRectangularRack((RectangularRack)labware);
		}
		else if (labware is Container)
		{
			DrawContainer((Container)labware);
		}
		else if (labware is CircularRack)
		{
			DrawCircularRack((CircularRack)labware);
		}
	}

	private void DrawTemplate(Template template)
	{
		Canvas canvas = SetupNewCanvas();
		ContentControl contentControl = new ContentControl();
		contentControl.Content = new Template2DViewModel(canvas.Height, template);
		canvas.Children.Add(contentControl);
		DrawingSurface = canvas;
	}

	private void DrawContainer(Container container)
	{
		Canvas canvas = SetupNewCanvas();
		double num = canvas.Width / 6.0;
		_ = canvas.Width * 2.0 / 3.0;
		TextBlock textBlock = new TextBlock();
		textBlock.Background = Brushes.Transparent;
		textBlock.Text = "Container Aperture Shape";
		textBlock.FontSize = canvas.Height * 0.025;
		textBlock.TextDecorations = TextDecorations.Underline;
		textBlock.Width = canvas.Width / 3.0;
		textBlock.TextAlignment = TextAlignment.Center;
		Canvas.SetLeft(textBlock, 0.0);
		Canvas.SetTop(textBlock, canvas.Height / 6.0);
		canvas.Children.Add(textBlock);
		TextBlock textBlock2 = new TextBlock();
		textBlock2.Background = Brushes.Transparent;
		textBlock2.Text = "Container Volume";
		textBlock2.FontSize = canvas.Height * 0.025;
		textBlock2.TextDecorations = TextDecorations.Underline;
		textBlock2.Width = canvas.Width / 3.0;
		textBlock2.TextAlignment = TextAlignment.Center;
		Canvas.SetLeft(textBlock2, 0.0);
		Canvas.SetTop(textBlock2, canvas.Height / 6.0 * 4.0);
		canvas.Children.Add(textBlock2);
		TextBlock textBlock3 = new TextBlock();
		textBlock3.Background = Brushes.Transparent;
		textBlock3.Text = "Container Cross Section (X-Axis)";
		textBlock3.FontSize = canvas.Height * 0.025;
		textBlock3.TextDecorations = TextDecorations.Underline;
		textBlock3.Width = canvas.Width / 3.0 * 2.0;
		textBlock3.TextAlignment = TextAlignment.Center;
		Canvas.SetLeft(textBlock3, canvas.Width / 3.0);
		Canvas.SetTop(textBlock3, canvas.Height / 6.0);
		canvas.Children.Add(textBlock3);
		if (container.Segments.Count > 0)
		{
			Brush fill = new SolidColorBrush(Color.FromRgb(25, 140, byte.MaxValue));
			if (container.Segments[0].Shape == HxLabwrEd2.Model.Shape.Rectangle)
			{
				Rectangle rectangle = new Rectangle();
				rectangle.Fill = fill;
				if (container.Segments[0].Dx < container.Segments[0].Dy)
				{
					rectangle.Height = canvas.Height / 6.0;
					rectangle.Width = canvas.Height / 6.0 * container.Segments[0].Dx / container.Segments[0].Dy;
				}
				else
				{
					rectangle.Width = canvas.Height / 6.0;
					rectangle.Height = canvas.Height / 6.0 * container.Segments[0].Dy / container.Segments[0].Dx;
				}
				Canvas.SetLeft(rectangle, num - rectangle.Width / 2.0);
				Canvas.SetTop(rectangle, canvas.Height / 6.0 * 2.0 - rectangle.Height / 2.0);
				canvas.Children.Add(rectangle);
			}
			else
			{
				Ellipse ellipse = new Ellipse();
				ellipse.Fill = fill;
				ellipse.Width = canvas.Height / 6.0;
				ellipse.Height = canvas.Height / 6.0;
				Canvas.SetLeft(ellipse, num - ellipse.Width / 2.0);
				Canvas.SetTop(ellipse, canvas.Height / 6.0 * 2.0 - ellipse.Height / 2.0);
				canvas.Children.Add(ellipse);
			}
			TextBlock textBlock4 = new TextBlock();
			textBlock4.Background = Brushes.Transparent;
			double num2 = 0.0;
			foreach (ContainerSegment segment in container.Segments)
			{
				num2 += segment.Volume;
			}
			textBlock4.Text = string.Format("{0} mL", (num2 / 1000.0).ToString("F4"));
			textBlock4.FontSize = canvas.Height * 0.03;
			textBlock4.FontWeight = FontWeights.Bold;
			textBlock4.Width = canvas.Width / 3.0;
			textBlock4.TextAlignment = TextAlignment.Center;
			Canvas.SetLeft(textBlock4, 0.0);
			Canvas.SetTop(textBlock4, canvas.Height / 12.0 * 9.0);
			canvas.Children.Add(textBlock4);
			ContentControl contentControl = new ContentControl();
			contentControl.Content = new ContainerCrossSectionViewModel(canvas.Height * 2.0 / 3.0, container.Segments);
			Canvas.SetLeft(contentControl, canvas.Width / 3.0);
			Canvas.SetTop(contentControl, canvas.Height / 6.0);
			canvas.Children.Add(contentControl);
		}
		else
		{
			TextBlock textBlock5 = new TextBlock();
			textBlock5.Background = Brushes.Transparent;
			textBlock5.Text = "N/A";
			textBlock5.FontSize = canvas.Height * 0.025 * 1.5;
			textBlock5.Width = canvas.Width / 3.0;
			textBlock5.TextAlignment = TextAlignment.Center;
			textBlock5.FontWeight = FontWeights.Bold;
			Canvas.SetLeft(textBlock5, 0.0);
			Canvas.SetTop(textBlock5, canvas.Height / 6.0 * 2.0);
			canvas.Children.Add(textBlock5);
			textBlock5 = new TextBlock();
			textBlock5.Background = Brushes.Transparent;
			textBlock5.Text = "N/A";
			textBlock5.FontSize = canvas.Height * 0.025 * 1.5;
			textBlock5.Width = canvas.Width / 3.0;
			textBlock5.TextAlignment = TextAlignment.Center;
			textBlock5.FontWeight = FontWeights.Bold;
			Canvas.SetLeft(textBlock5, 0.0);
			Canvas.SetTop(textBlock5, canvas.Height / 12.0 * 9.0);
			canvas.Children.Add(textBlock5);
			textBlock5 = new TextBlock();
			textBlock5.Background = Brushes.Transparent;
			textBlock5.Text = "N/A";
			textBlock5.FontSize = canvas.Height * 0.025 * 1.5;
			textBlock5.Width = canvas.Width / 3.0 * 2.0;
			textBlock5.TextAlignment = TextAlignment.Center;
			textBlock5.FontWeight = FontWeights.Bold;
			Canvas.SetLeft(textBlock5, canvas.Width / 3.0);
			Canvas.SetTop(textBlock5, canvas.Height / 2.0);
			canvas.Children.Add(textBlock5);
		}
		DrawingSurface = canvas;
	}

	private void DrawRectangularRack(RectangularRack rectangularRack)
	{
		Canvas canvas = SetupNewCanvas();
		if (rectangularRack.RackWells.Count > 300)
		{
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"ShadowLoadingApplication");
			Application.Current.Dispatcher.BeginInvoke((Action)delegate
			{
				Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnshadowApplication");
			}, DispatcherPriority.Background, null);
		}
		ContentControl element = new ContentControl
		{
			Content = new RectangularRack2DViewModel(canvas.Height, rectangularRack)
		};
		canvas.Children.Add(element);
		DrawingSurface = canvas;
	}

	private void DrawCircularRack(CircularRack circularRack)
	{
		if (circularRack.RackWells.Count > 300)
		{
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"ShadowLoadingApplication");
			Application.Current.Dispatcher.BeginInvoke((Action)delegate
			{
				Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnshadowApplication");
			}, DispatcherPriority.Background, null);
		}
		DrawingSurface = new CircularRack2DViewModel(circularRack);
	}

	private static Canvas SetupNewCanvas(double width = 100000.0, double height = 100000.0)
	{
		return new Canvas
		{
			ClipToBounds = true,
			Height = width,
			Width = height,
			Background = Brushes.White
		};
	}
}
