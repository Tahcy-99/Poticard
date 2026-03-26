package org.example.porti.config.interceptor;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.example.porti.user.model.AuthUserDetails;
import org.example.porti.utils.JwtUtil;
import org.jspecify.annotations.Nullable;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {
    private final JwtUtil jwtUtil;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        if(request instanceof ServletServerHttpRequest serverHttpRequest) {
            HttpServletRequest httpReq = serverHttpRequest.getServletRequest();
            if(httpReq.getCookies() != null) {
                for(Cookie cookie : httpReq.getCookies()) {
                    if(cookie.getName().equals("ATOKEN")) {
                        Long idx = jwtUtil.getUserIdx(cookie.getValue());
                        String username = jwtUtil.getUsername(cookie.getValue());
                        String role = jwtUtil.getRole(cookie.getValue());

                        AuthUserDetails user = AuthUserDetails.builder()
                                .idx(idx)
                                .username(username)
                                .role(role)
                                .build();

                        Authentication authentication = new UsernamePasswordAuthenticationToken(user, null, List.of(new SimpleGrantedAuthority(role)));
                        attributes.put("user", authentication);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, @Nullable Exception exception) {

    }
}
