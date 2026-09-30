package com.freestylegamedesign.spearrelay;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Locale;

public final class MainActivity extends Activity {
    private static final String APP_HOST = "appassets.androidplatform.net";

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enterImmersiveMode();

        try {
            createGameWebView();
        } catch (RuntimeException | LinkageError startupError) {
            showStartupFallback(startupError);
        }
    }

    private void createGameWebView() {
        webView = new WebView(this);
        webView.setBackgroundColor(0xFF101827);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.setWebViewClient(new LocalAssetClient());
        setContentView(webView);
        webView.loadUrl("https://" + APP_HOST + "/index.html");
    }

    private void showStartupFallback(Throwable startupError) {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setPadding(48, 48, 48, 48);
        layout.setBackgroundColor(0xFF101827);

        TextView title = new TextView(this);
        title.setText("Energy Relay couldn’t start");
        title.setTextColor(Color.WHITE);
        title.setTextSize(24);
        title.setGravity(Gravity.CENTER);

        TextView message = new TextView(this);
        message.setText(
            "Please update Google Chrome and Android System WebView in Google Play, " +
            "restart your phone, and open Energy Relay again."
        );
        message.setTextColor(0xFFD7E6F2);
        message.setTextSize(16);
        message.setGravity(Gravity.CENTER);
        message.setPadding(0, 28, 0, 0);

        TextView detail = new TextView(this);
        detail.setText("Startup error: " + startupError.getClass().getSimpleName());
        detail.setTextColor(0xFF8FA9BC);
        detail.setTextSize(12);
        detail.setGravity(Gravity.CENTER);
        detail.setPadding(0, 20, 0, 0);

        layout.addView(
            title,
            new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        );
        layout.addView(
            message,
            new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        );
        layout.addView(
            detail,
            new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        );

        setContentView(layout);
    }

    private void handleBackNavigation() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }

        finish();
    }

    @SuppressWarnings("deprecation")
    private void enterImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enterImmersiveMode();
        }
    }

    @Override
    protected void onPause() {
        if (webView != null) {
            webView.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
        enterImmersiveMode();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        handleBackNavigation();
    }

    private final class LocalAssetClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(
            WebView view,
            WebResourceRequest request
        ) {
            Uri uri = request.getUrl();
            if (!"https".equals(uri.getScheme()) || !APP_HOST.equals(uri.getHost())) {
                return notFound();
            }

            String path = uri.getPath();
            if (path == null || path.equals("/")) {
                path = "/index.html";
            }

            path = path.substring(1);
            if (path.contains("..")) {
                return notFound();
            }

            try {
                InputStream input = getAssets().open(path);
                return new WebResourceResponse(mimeType(path), encoding(path), input);
            } catch (IOException ignored) {
                return notFound();
            }
        }

        private WebResourceResponse notFound() {
            return new WebResourceResponse(
                "text/plain",
                "UTF-8",
                404,
                "Not Found",
                Collections.emptyMap(),
                new ByteArrayInputStream("Not Found".getBytes(StandardCharsets.UTF_8))
            );
        }

        private String encoding(String path) {
            String mime = mimeType(path);
            return mime.startsWith("text/") ||
                    mime.contains("javascript") ||
                    mime.contains("json")
                ? "UTF-8"
                : null;
        }

        private String mimeType(String path) {
            String lower = path.toLowerCase(Locale.ROOT);
            if (lower.endsWith(".html")) return "text/html";
            if (lower.endsWith(".css")) return "text/css";
            if (lower.endsWith(".js")) return "text/javascript";
            if (lower.endsWith(".json") || lower.endsWith(".webmanifest")) {
                return "application/json";
            }
            if (lower.endsWith(".svg")) return "image/svg+xml";
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                return "image/jpeg";
            }
            if (lower.endsWith(".webp")) return "image/webp";
            return "application/octet-stream";
        }
    }
}
